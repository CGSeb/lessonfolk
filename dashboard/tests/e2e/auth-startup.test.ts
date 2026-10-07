/**
 * Startup checks of the built server (scripts/serve.ts): settings it must refuse
 * before it listens. No Postgres needed.
 */
import { describe, expect, it } from 'vitest';
import { expectStartupFailure, freePort } from './server';

const SECRET = 'test-secret-that-is-long-enough-1234567890';

describe('startup checks', () => {
  it('refuse LESSONFOLK_AUTH=none when the server listens on every address', async () => {
    const { code, output } = await expectStartupFailure({ LESSONFOLK_AUTH: 'none', HOST: '0.0.0.0' });
    expect(code).toBe(1);
    expect(output).toContain('LESSONFOLK_AUTH=none has no sign-in, so it only runs on 127.0.0.1');
    expect(output).toContain('"0.0.0.0" (from HOST)');
    expect(output).not.toMatch(/listening on/i);
  });

  it('refuse LESSONFOLK_AUTH=none when docker compose publishes the port beyond 127.0.0.1', async () => {
    // Inside the container the server listens on 0.0.0.0; LESSONFOLK_BIND is the published address.
    const { code, output } = await expectStartupFailure({ HOST: '0.0.0.0', LESSONFOLK_BIND: '0.0.0.0' });
    expect(code).toBe(1);
    expect(output).toContain('"0.0.0.0" (from LESSONFOLK_BIND)');
  });

  it('refuse LESSONFOLK_AUTH=none without a reachable database, saying how to start it', async () => {
    // A port nothing listens on.
    const port = await freePort();
    const { code, output } = await expectStartupFailure({
      DATABASE_URL: `postgres://lessonfolk:secret-password@127.0.0.1:${port}/lessonfolk`,
    });
    expect(code).toBe(1);
    expect(output).toContain('LessonFolk cannot start: your progress is kept in Postgres');
    expect(output).toContain('docker compose up -d db');
    expect(output).not.toContain('secret-password');
    expect(output).not.toMatch(/listening on/i);
  });

  it('refuse LESSONFOLK_AUTH=oauth without any provider', async () => {
    const { code, output } = await expectStartupFailure({
      LESSONFOLK_AUTH: 'oauth',
      LESSONFOLK_BASE_URL: 'http://localhost:4321',
      BETTER_AUTH_SECRET: SECRET,
    });
    expect(code).toBe(1);
    expect(output).toContain('LESSONFOLK_AUTH=oauth needs at least one sign-in provider');
    expect(output).not.toMatch(/listening on/i);
  });

  it('refuse an unknown LESSONFOLK_AUTH', async () => {
    const { code, output } = await expectStartupFailure({ LESSONFOLK_AUTH: 'password' });
    expect(code).toBe(1);
    expect(output).toContain('LESSONFOLK_AUTH is "password"');
  });
});
