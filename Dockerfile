# LessonFolk dashboard server, with the courses bundled in the image.
# Built and started by docker-compose.yml (`docker compose up --build`).

# --- Dependencies: every workspace, dev dependencies included (needed to build) ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY dashboard/package.json dashboard/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/mcp/package.json packages/mcp/
RUN npm ci --no-audit --no-fund

# --- Build: the Astro server (dashboard/dist) ---
FROM deps AS build
COPY packages/core packages/core
COPY packages/db packages/db
COPY packages/mcp packages/mcp
COPY dashboard dashboard
RUN npm run build --workspace dashboard

# --- Production dependencies only ---
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY dashboard/package.json dashboard/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/mcp/package.json packages/mcp/
# drizzle-kit (and the esbuild binaries it bundles) is an optional peer of better-auth, only used
# by the schema-generation CLI: keep it, and its CVE-laden Go binaries, out of the image.
RUN npm ci --omit=dev --no-audit --no-fund \
    && rm -rf node_modules/drizzle-kit node_modules/@esbuild-kit

# --- Runtime ---
FROM node:22-alpine
# The server only needs `node`: drop npm, npx, corepack and yarn (their bundled packages carry
# CVEs, and a package manager is of no use to the app).
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    LESSONFOLK_ROOT=/app
COPY package.json ./
COPY --from=prod-deps /app/node_modules node_modules
COPY dashboard/package.json dashboard/
COPY --from=build /app/dashboard/dist dashboard/dist
# The launcher runs the sign-in startup checks before the server (run with Node's type stripping).
COPY dashboard/scripts/serve.ts dashboard/scripts/
COPY dashboard/src/lib/auth/settings.ts dashboard/src/lib/auth/local-learner.ts dashboard/src/lib/auth/
COPY packages/core/package.json packages/core/
COPY packages/core/src packages/core/src
COPY packages/db/package.json packages/db/
COPY packages/mcp/package.json packages/mcp/
COPY packages/db/src packages/db/src
COPY packages/db/drizzle packages/db/drizzle
COPY packages/mcp/src packages/mcp/src
# The tutor prompts (also bundled in dashboard/dist by the build), kept next to their loader.
COPY packages/mcp/prompts packages/mcp/prompts
COPY courses courses
USER node
EXPOSE 4321
# Apply pending database migrations, then check the sign-in settings and start the dashboard.
# The server listens on 0.0.0.0 inside the container; docker-compose.yml publishes it on
# LESSONFOLK_BIND (127.0.0.1 by default), which is what the LESSONFOLK_AUTH=none check uses.
CMD ["sh", "-c", "node --experimental-strip-types --disable-warning=ExperimentalWarning packages/db/src/migrate-cli.ts && exec node --experimental-strip-types --disable-warning=ExperimentalWarning dashboard/scripts/serve.ts"]
