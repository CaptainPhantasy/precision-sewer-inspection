import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const directory = mkdtempSync(join(tmpdir(), 'psi-script-config-'));
const fixtureUrl = new URL('postgresql://127.0.0.1:1/psi_config_test');
fixtureUrl.username = 'psi_config_test';
fixtureUrl.password = randomUUID();
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/DATABASE|^DIRECT_URL$|^PG|^DOTENV_|TOKEN|SECRET|PASSWORD|CREDENTIAL/.test(key)) delete env[key];
}
const tsx = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url));
const invoke = (moduleName) => {
  const modulePath = fileURLToPath(new URL(`../lib/${moduleName}.ts`, import.meta.url));
  const code = `import { createPrismaClient } from ${JSON.stringify(modulePath)};
    const client = createPrismaClient();
    client.$disconnect().then(() => console.log('constructed-without-connecting'));`;
  return spawnSync(tsx, ['--eval', code], { cwd: directory, env, encoding: 'utf8' });
};
try {
  writeFileSync(join(directory, '.env'), `DATABASE_URL=${fixtureUrl}\n`, { mode: 0o600 });
  // The server factory intentionally does not load files itself. This reproduces
  // the missing-environment failure of the original standalone script imports.
  assert.notEqual(invoke('prisma-client').status, 0, 'Unloaded environment must fail closed.');
  const result = invoke('prisma-script-client');
  assert.equal(result.status, 0, 'Standalone client must load its .env before construction.');
  assert.equal(result.stdout.trim(), 'constructed-without-connecting');
  console.log('Standalone script dotenv loading passed; no database connection or record write.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
