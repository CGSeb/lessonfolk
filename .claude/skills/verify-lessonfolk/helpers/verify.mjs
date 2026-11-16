#!/usr/bin/env node
/**
 * Harness of the verify-lessonfolk skill. Plain Node, no build step.
 *
 *   node .claude/skills/verify-lessonfolk/helpers/verify.mjs <command> [options]
 *
 *   launch [--auth none]          fresh empty database + production build + server on a free port
 *   doctor                        read-only health check of the instance this skill launched
 *   browser <action> [options]    one Playwright action (see below); cookies and page persist between calls
 *   http <METHOD> <path>          plain HTTP request, prints status, headers and body (--header "K: V", --form k=v)
 *   db "<select ...>"             read-only SQL on the verification database (cross-check stored data)
 *   evidence                      list the proof files of the current run
 *   teardown                      stop what launch started, drop the database; evidence stays
 *
 * Browser actions (all take --feature <id> to file evidence under evidence/<id>/):
 *   goto --url /courses            click --role link --name "Courses"      fill --role textbox --name "X" --value "v"
 *   expect-text|expect-no-text --text "..." [--exact]  expect-visible --role heading --name "X"  expect-url --url /courses
 *   snapshot --path name.aria.txt  screenshot --path name.png              cookies   set-language --lang fr
 *   Options: --accept-language fr  --viewport 1280x800
 * Locators are ARIA roles and accessible names (or --testid), never CSS or DOM position.
 * Evidence lives in .verify/<run>/evidence/ and survives teardown.
 */
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, openSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const VERIFY = join(ROOT, '.verify');
const DASHBOARD = join(ROOT, 'dashboard');
const DB_ADMIN_URL = process.env.DATABASE_URL ?? 'postgres://lessonfolk:lessonfolk@127.0.0.1:5432/lessonfolk';

const [command, ...rest] = process.argv.slice(2);
const args = {};
const positional = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) args[rest[i].slice(2)] = true;
    else {
      const key = rest[i].slice(2);
      args[key] = key in args ? [].concat(args[key], next) : next; // a repeated option (--header) keeps every value
      i++;
    }
  } else positional.push(rest[i]);
}

const out = (value) => console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
const fail = (message, code = 1) => {
  console.error(`verify: ${message}`);
  process.exit(code);
};

// ---------- state ----------

const currentFile = join(VERIFY, 'current');
const runDir = () => {
  if (!existsSync(currentFile)) fail('no run in progress: start with `launch`');
  return join(VERIFY, readFileSync(currentFile, 'utf8').trim());
};
const readState = () => JSON.parse(readFileSync(join(runDir(), 'state.json'), 'utf8'));
const writeState = (dir, state) => writeFileSync(join(dir, 'state.json'), JSON.stringify(state, null, 2));
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
/** Git Bash rewrites an argument like `/courses` into `C:/Program Files/Git/courses`: undo it. */
const fixPath = (v) => (typeof v === 'string' ? v.replace(/^[A-Za-z]:[\/]+(?:Program Files[\/]+Git|msys64|Git)(?=[\/]|$)/i, '') || '/' : v);
const baseUrl = (state) => `http://127.0.0.1:${state.port}`;

async function sql() {
  const require = createRequire(join(ROOT, 'packages/db/package.json'));
  const { default: postgres } = await import(pathToFileURL(require.resolve('postgres')).href);
  return postgres;
}
const withDb = (url, name) => {
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u.toString();
};
const freePort = () =>
  new Promise((ok, no) => {
    const s = createServer();
    s.once('error', no);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => ok(port));
    });
  });
const run = (cmd, argv, opts = {}) => spawnSync(cmd, argv, { cwd: ROOT, encoding: 'utf8', shell: false, ...opts });
const git = (...argv) => run('git', argv).stdout.trim();

// ---------- launch ----------

async function launch() {
  mkdirSync(VERIFY, { recursive: true });
  if (existsSync(currentFile)) {
    const old = JSON.parse(readFileSync(join(VERIFY, readFileSync(currentFile, 'utf8').trim(), 'state.json'), 'utf8'));
    if (old.pid && alive(old.pid)) fail(`run ${old.runId} is still up (pid ${old.pid}): run \`teardown\` first, or drive it`);
  }
  const runId = `${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${Math.random().toString(16).slice(2, 6)}`;
  const dir = join(VERIFY, runId);
  mkdirSync(join(dir, 'evidence'), { recursive: true });
  const state = { runId, startedAt: new Date().toISOString(), head: git('rev-parse', 'HEAD'), startedDb: false, pid: null };

  // 1. Postgres: use the compose `db` service, start it only if it is down (and then stop it in teardown).
  const postgres = await sql();
  const reachable = async () => {
    const probe = postgres(DB_ADMIN_URL, { max: 1, connect_timeout: 3, onnotice: () => {} });
    try {
      await probe`select 1`;
      return true;
    } catch {
      return false;
    } finally {
      await probe.end({ timeout: 1 });
    }
  };
  if (!(await reachable())) {
    state.startedDb = true;
    const up = run('docker', ['compose', 'up', '-d', '--wait', 'db']);
    if (up.status !== 0 || !(await reachable())) fail(`Postgres is not reachable and \`docker compose up -d db\` failed:\n${up.stderr || up.stdout}`);
  }

  // 2. An empty database, so the run starts from no data at all.
  state.dbName = `lessonfolk_verify_${runId.replace(/\W/g, '_')}`;
  state.dbUrl = withDb(DB_ADMIN_URL, state.dbName);
  const admin = postgres(DB_ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`create database "${state.dbName}"`);
  await admin.end({ timeout: 1 });

  // 3. Production build into a private folder (never the learner's own dashboard/dist).
  state.cacheDir = join(DASHBOARD, 'node_modules', '.cache', `lessonfolk-verify-${runId}`);
  const astroBin = join(dirname(createRequire(join(DASHBOARD, 'package.json')).resolve('astro/package.json')), 'bin', 'astro.mjs');
  const build = run(process.execPath, [astroBin, 'build', '--outDir', join(state.cacheDir, 'dist')], {
    cwd: DASHBOARD,
    env: { ...process.env, NODE_ENV: 'production', NO_COLOR: '1' },
  });
  const entry = join(state.cacheDir, 'dist', 'server', 'entry.mjs');
  writeFileSync(currentFile, runId);
  writeState(dir, state);
  if (build.status !== 0 || !existsSync(entry)) fail(`dashboard build failed:\n${build.stdout}\n${build.stderr}`);

  // 4. The server: no sign-in (one local learner), on a free port, migrating the empty database on start.
  state.port = await freePort();
  const emptyRoot = join(dir, 'root'); // no .progress/progress.json, so no first-run import offer
  mkdirSync(emptyRoot, { recursive: true });
  const log = join(dir, 'server.log');
  writeFileSync(log, '');
  const env = { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(state.port), DATABASE_URL: state.dbUrl, LESSONFOLK_AUTH: args.auth ?? 'none', LESSONFOLK_ROOT: emptyRoot, LESSONFOLK_COURSES_DIR: join(ROOT, 'courses'), LESSONFOLK_PROJECTS_DIR: join(ROOT, 'projects'), NO_COLOR: '1', FORCE_COLOR: '0' };
  for (const k of ['LESSONFOLK_BASE_URL', 'LESSONFOLK_MCP_TOKEN', 'UMAMI_WEBSITE_ID']) delete env[k];
  // Output goes straight to a file and the child is detached, so the server outlives this launcher process.
  const logFd = openSync(log, 'a');
  const child = spawn(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', join(DASHBOARD, 'scripts', 'serve.ts'), entry], { cwd: DASHBOARD, env, stdio: ['ignore', logFd, logFd], detached: true, windowsHide: true });
  closeSync(logFd);
  state.pid = child.pid;
  writeState(dir, state);
  child.unref();

  // 5. Ready = usable: the local learner exists, so /api/me answers with a user (not just "a process listens").
  const deadline = Date.now() + 45_000;
  let ready = false;
  while (Date.now() < deadline && alive(child.pid)) {
    try {
      const me = await (await fetch(`${baseUrl(state)}/api/me`)).json();
      if (me.user?.id === 'local') {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!ready) fail(`server not usable in 45 s. Last log lines:\n${readFileSync(log, 'utf8').split('\n').slice(-15).join('\n')}`);
  out({ ready: true, runId, url: baseUrl(state), pid: state.pid, database: state.dbName, evidence: join(dir, 'evidence') });
}

// ---------- doctor ----------

async function doctor() {
  const state = readState();
  const problems = [];
  const info = { run: state.runId, url: baseUrl(state) };
  if (!alive(state.pid)) problems.push(`process ${state.pid} is not running`);
  try {
    const res = await fetch(`${baseUrl(state)}/api/me`);
    const me = await res.json();
    info.authMode = me.authMode;
    info.user = me.user?.id ?? null;
    if (me.authMode !== 'none' && !args.auth) problems.push(`authMode is ${me.authMode}, expected none`);
    if (!me.user && me.authMode === 'none') problems.push('no local learner');
  } catch (e) {
    problems.push(`${baseUrl(state)}/api/me does not answer (${e.message})`);
  }
  const head = git('rev-parse', 'HEAD');
  info.build = state.head.slice(0, 8);
  if (head !== state.head) problems.push(`HEAD moved since the build (${state.head.slice(0, 8)} -> ${head.slice(0, 8)}): relaunch to verify the current code`);
  if (git('status', '--porcelain', '--', 'dashboard', 'packages', 'courses')) info.note = 'working tree has uncommitted changes under dashboard/, packages/ or courses/ (the build includes them if made before launch)';
  try {
    const postgres = await sql();
    const db = postgres(state.dbUrl, { max: 1, connect_timeout: 3, onnotice: () => {} });
    const [{ n }] = await db`select count(*)::int as n from learner`;
    info.learners = n;
    await db.end({ timeout: 1 });
  } catch (e) {
    problems.push(`database ${state.dbName} unreachable (${e.message.split('\n')[0]})`);
  }
  out({ ...info, healthy: problems.length === 0, problems });
  process.exit(problems.length ? 1 : 0);
}

// ---------- browser ----------

/** Browsers to try, in order: CHROME_PATH, Playwright's Chromium, then the system Chrome or Edge (headless, throwaway profile). */
function browserCandidates() {
  const found = [];
  if (process.env.CHROME_PATH) found.push(process.env.CHROME_PATH);
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright'), join(homedir(), '.cache', 'ms-playwright'), join(homedir(), 'Library', 'Caches', 'ms-playwright')].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const d of readdirSync(root).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium']) {
        if (existsSync(join(root, d, rel))) found.push(join(root, d, rel));
      }
    }
  }
  for (const p of ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']) if (existsSync(p)) found.push(p);
  if (!found.length) fail('no Chromium, Chrome or Edge found: run `npx playwright-core install chromium` in the helpers folder, or set CHROME_PATH');
  return found;
}

async function browser() {
  const [action] = positional;
  const state = readState();
  if (!alive(state.pid)) fail('the instance is not running: run `doctor`');
  const dir = runDir();
  const feature = args.feature ?? 'misc';
  const evidenceDir = join(dir, 'evidence', feature);
  mkdirSync(evidenceDir, { recursive: true });
  const require = createRequire(join(HERE, 'package.json'));
  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch {
    fail('playwright-core is missing: `npm install --prefix .claude/skills/verify-lessonfolk/helpers`');
  }
  const stateFile = join(dir, 'browser-state.json');
  const sessionFile = join(dir, 'browser-session.json');
  const session = existsSync(sessionFile) ? JSON.parse(readFileSync(sessionFile, 'utf8')) : {};
  const [w, h] = String(args.viewport ?? '1280x800').split('x').map(Number);
  let browserApp;
  const launchErrors = [];
  for (const executablePath of browserCandidates()) {
    try {
      browserApp = await chromium.launch({ executablePath, headless: true });
      break;
    } catch (e) {
      launchErrors.push(`${executablePath}: ${e.message.split('\n')[0]}`);
    }
  }
  if (!browserApp) fail(`no browser could start:\n${launchErrors.join('\n')}`);
  const context = await browserApp.newContext({
    viewport: { width: w, height: h },
    storageState: existsSync(stateFile) ? stateFile : undefined,
    locale: args['accept-language'] ?? session.acceptLanguage ?? 'en-US',
  });
  const page = await context.newPage();
  // Only pages of the instance this run launched are ever driven.
  const target = (u) => {
    const full = fixPath(u)?.startsWith('/') ? baseUrl(state) + fixPath(u) : u;
    if (!full?.startsWith(baseUrl(state))) fail(`refusing to drive ${u}: not a page of ${baseUrl(state)}`);
    return full;
  };
  const locator = () => {
    if (args.testid) return page.getByTestId(args.testid);
    if (args.role) return page.getByRole(args.role, args.name ? { name: args.name, exact: args.exact ? true : undefined } : {});
    if (args.label) return page.getByLabel(args.label);
    fail('give --role (with --name) or --testid');
  };
  const record = { at: new Date().toISOString(), feature, action, ...Object.fromEntries(Object.entries(args).filter(([k]) => k !== 'feature')) };
  let ok = true;
  let detail = {};
  try {
    if (action !== 'goto' && session.url) await page.goto(session.url);
    switch (action) {
      case 'goto':
        await page.goto(target(args.url));
        break;
      case 'click':
        await locator().first().click({ timeout: 8000 });
        await page.waitForLoadState('load');
        break;
      case 'fill':
        await locator().first().fill(String(args.value ?? ''), { timeout: 8000 });
        if (args.submit) {
          // Wait for the navigation the submit triggers before the URL is recorded.
          const before = page.url();
          const moved = page.waitForURL((u) => u.href !== before, { timeout: 5000 }).catch(() => {});
          await page.keyboard.press('Enter');
          await moved;
          await page.waitForLoadState('load');
        }
        break;
      case 'expect-text': {
        const body = await page.locator('body').innerText();
        // Text as the user sees it: CSS may upper-case it, so the match ignores case unless --exact.
        ok = args.exact ? body.includes(args.text) : body.toLowerCase().includes(String(args.text).toLowerCase());
        detail = { expected: args.text, found: ok };
        break;
      }
      case 'expect-no-text': {
        const body = await page.locator('body').innerText();
        ok = !(args.exact ? body.includes(args.text) : body.toLowerCase().includes(String(args.text).toLowerCase()));
        detail = { expectedAbsent: args.text, absent: ok };
        break;
      }
      case 'expect-visible':
        await locator().first().waitFor({ state: 'visible', timeout: 8000 });
        break;
      case 'expect-url':
        ok = new URL(page.url()).pathname + new URL(page.url()).search === fixPath(args.url) || page.url() === target(args.url);
        detail = { expected: args.url, actual: page.url() };
        break;
      case 'snapshot': {
        const path = join(evidenceDir, args.path ?? 'page.aria.txt');
        writeFileSync(path, await page.locator('body').ariaSnapshot());
        detail = { path };
        break;
      }
      case 'screenshot': {
        const path = join(evidenceDir, args.path ?? 'page.png');
        await page.screenshot({ path, fullPage: true });
        detail = { path };
        break;
      }
      case 'cookies': {
        const cookies = await context.cookies();
        const path = join(evidenceDir, args.path ?? 'cookies.json');
        writeFileSync(path, JSON.stringify(cookies, null, 2));
        detail = { path, cookies: cookies.map((c) => ({ name: c.name, value: c.value, path: c.path, httpOnly: c.httpOnly, sameSite: c.sameSite, secure: c.secure, expiresInDays: c.expires > 0 ? Math.round((c.expires - Date.now() / 1000) / 86400) : 'session' })) };
        break;
      }
      case 'set-language': {
        // The footer switcher: a real form post, exactly like a visitor choosing a language.
        await page.getByRole('group', { name: /language|langue/i }).getByRole('button', { name: args.lang === 'fr' ? 'Français' : 'English' }).click();
        await page.waitForLoadState('load');
        break;
      }
      default:
        fail(`unknown browser action "${action}"`, 2);
    }
    detail = { ...detail, url: page.url(), title: await page.title() };
    writeFileSync(sessionFile, JSON.stringify({ url: page.url(), acceptLanguage: args['accept-language'] ?? session.acceptLanguage }));
    await context.storageState({ path: stateFile });
  } catch (e) {
    ok = false;
    detail = { ...detail, error: e.message.split('\n')[0], url: page.url() };
  } finally {
    await browserApp.close();
  }
  appendFileSync(join(dir, 'evidence', 'actions.log'), JSON.stringify({ ...record, ok, ...detail }) + '\n');
  out({ ok, action, ...detail });
  process.exit(ok ? 0 : 1);
}

// ---------- http ----------

async function http() {
  const [method = 'GET'] = positional;
  const path = fixPath(positional[1] ?? '/');
  const state = readState();
  const headers = {};
  for (const h of [].concat(args.header ?? [])) {
    const i = String(h).indexOf(':');
    headers[h.slice(0, i).trim()] = h.slice(i + 1).trim();
  }
  let body;
  if (args.form) {
    body = new URLSearchParams(Object.fromEntries(String(args.form).split('&').map((p) => p.split('=').map(decodeURIComponent))));
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers.Origin ??= baseUrl(state);
  }
  const res = await fetch(baseUrl(state) + path, { method, headers, body, redirect: 'manual' });
  const text = await res.text();
  const result = { method, path, status: res.status, headers: Object.fromEntries([...res.headers].filter(([k]) => k !== 'set-cookie')), setCookie: res.headers.getSetCookie(), bodyStart: text.slice(0, args.body ? Number(args.body) : 300) };
  if (args.feature) {
    const dir = join(runDir(), 'evidence', args.feature);
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(runDir(), 'evidence', 'actions.log'), JSON.stringify({ at: new Date().toISOString(), feature: args.feature, action: 'http', method, path, status: res.status }) + '\n');
    writeFileSync(join(dir, args.path ?? `http-${method}-${path.replace(/\W+/g, '_')}.json`), JSON.stringify(result, null, 2));
  }
  out(result);
}

// ---------- db ----------

async function db() {
  const query = positional[0];
  if (!query || !/^\s*select\b/i.test(query)) fail('db runs a single read-only SELECT');
  const state = readState();
  const postgres = await sql();
  const conn = postgres(state.dbUrl, { max: 1, onnotice: () => {} });
  try {
    const rows = await conn.begin('read only', (tx) => tx.unsafe(query));
    if (args.feature) {
      const dir = join(runDir(), 'evidence', args.feature);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, args.path ?? 'db.json'), JSON.stringify({ query, rows }, null, 2));
    }
    out(rows);
  } finally {
    await conn.end({ timeout: 1 });
  }
}

// ---------- evidence / teardown ----------

function evidence() {
  const dir = join(runDir(), 'evidence');
  const files = [];
  const walk = (d, p = '') => {
    for (const e of readdirSync(d, { withFileTypes: true })) (e.isDirectory() ? walk(join(d, e.name), `${p}${e.name}/`) : files.push(`${p}${e.name}`));
  };
  walk(dir);
  out({ dir, files });
}

async function teardown() {
  const state = readState();
  const dir = runDir();
  const report = [];
  // Only what this run started: its server (by pid), its database, its build. Never by process name.
  if (state.pid && alive(state.pid)) {
    if (process.platform === 'win32') run('taskkill', ['/PID', String(state.pid), '/T', '/F']);
    else process.kill(state.pid, 'SIGTERM');
    report.push(`stopped server pid ${state.pid}`);
  }
  try {
    const postgres = await sql();
    const admin = postgres(DB_ADMIN_URL, { max: 1, onnotice: () => {} });
    await admin.unsafe(`drop database if exists "${state.dbName}" with (force)`);
    await admin.end({ timeout: 1 });
    report.push(`dropped database ${state.dbName}`);
  } catch (e) {
    report.push(`could not drop ${state.dbName}: ${e.message.split('\n')[0]}`);
  }
  if (state.cacheDir) {
    rmSync(state.cacheDir, { recursive: true, force: true });
    report.push('removed the private build');
  }
  rmSync(join(dir, 'browser-state.json'), { force: true });
  rmSync(join(dir, 'browser-session.json'), { force: true });
  if (state.startedDb) {
    run('docker', ['compose', 'stop', 'db']);
    report.push('stopped the db service (this run had started it)');
  }
  rmSync(currentFile, { force: true });
  out({ teardown: report, evidenceKept: join(dir, 'evidence') });
}

const commands = { launch, doctor, browser, http, db, evidence, teardown };
if (!commands[command]) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace('#!/usr/bin/env node\n', ''));
  process.exit(command ? 2 : 0);
}
await commands[command]();
