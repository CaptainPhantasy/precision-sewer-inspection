import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(root, '.env.test.local');
const command = process.argv[2];
const commands = ['setup', 'seed', 'check', 'mail', 'app', 'dev', 'build', 'stop', 'status'];
const secret = () => randomBytes(32).toString('hex');

function initialize() {
  if (existsSync(envPath)) return;
  const password = secret();
  const values = {
    PSI_TEST_MODE: 'true',
    PSI_TEST_POSTGRES_PASSWORD: password,
    DATABASE_URL: `postgresql://psi_test:${password}@127.0.0.1:55432/psi_test`,
    PSI_TEST_USER_PASSWORD: secret(),
    NEXTAUTH_SECRET: secret(),
    DOWNLOAD_TOKEN_SECRET: secret(),
    CRON_SECRET: secret(),
    NEXTAUTH_URL: 'http://localhost:3001',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3001',
    PSI_TEST_EMAIL_RECIPIENT: 'douglastalley1977@gmail.com',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: '11025',
    SMTP_SECURE: 'false',
    SMTP_FROM: 'psi-testing@example.test',
    // Existing Stripe module constructs its client at import time. This invalid
    // value permits that import; it cannot authenticate or simulate a payment.
    STRIPE_SECRET_KEY: 'sk_test_not_configured',
  };
  writeFileSync(envPath, '# Private, generated local test configuration. Do not commit.\n'
    + Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
  { flag: 'wx', mode: 0o600 });
  console.log('Created private .env.test.local; generated passwords are not printed.');
}

function environment() {
  if (!existsSync(envPath)) throw new Error('Run npm run test:setup first.');
  // Next and Prisma load these automatically. Refuse ambiguous configurations.
  for (const filename of ['.env', '.env.local', '.env.development', '.env.development.local', '.env.production', '.env.production.local']) {
    if (existsSync(join(root, filename))) {
      throw new Error(`Move ${filename} out of this checkout before using the isolated test environment.`);
    }
  }
  chmodSync(envPath, 0o600);
  const config = dotenv.parse(readFileSync(envPath));
  const db = new URL(config.DATABASE_URL || '');
  if (config.PSI_TEST_MODE !== 'true' || db.protocol !== 'postgresql:' ||
      !['127.0.0.1', 'localhost'].includes(db.hostname) || db.port !== '55432' ||
      db.username !== 'psi_test' || db.pathname !== '/psi_test' || db.search || db.hash ||
      !config.PSI_TEST_POSTGRES_PASSWORD ||
      decodeURIComponent(db.password) !== config.PSI_TEST_POSTGRES_PASSWORD ||
      !config.PSI_TEST_USER_PASSWORD || !config.NEXTAUTH_SECRET) {
    throw new Error('Test configuration must use the generated local psi_test database and passwords.');
  }
  if (config.SMTP_HOST !== '127.0.0.1' || config.SMTP_PORT !== '11025' || config.SMTP_SECURE !== 'false' ||
      config.SMTP_USER || config.SMTP_PASSWORD) {
    throw new Error('This local environment requires unauthenticated Mailpit on 127.0.0.1:11025.');
  }
  if (config.NEXTAUTH_URL !== 'http://localhost:3001' || config.NEXT_PUBLIC_SITE_URL !== 'http://localhost:3001') {
    throw new Error('Test site URLs must point to http://localhost:3001.');
  }
  const allowed = new Set(['PSI_TEST_MODE', 'PSI_TEST_POSTGRES_PASSWORD', 'DATABASE_URL',
    'PSI_TEST_USER_PASSWORD', 'NEXTAUTH_SECRET', 'DOWNLOAD_TOKEN_SECRET', 'CRON_SECRET',
    'NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL', 'PSI_TEST_EMAIL_RECIPIENT', 'SMTP_HOST',
    'SMTP_PORT', 'SMTP_SECURE', 'SMTP_FROM', 'STRIPE_SECRET_KEY']);
  for (const key of Object.keys(config)) {
    if (!allowed.has(key)) throw new Error(`Unexpected setting ${key}: external integrations need separate test configuration.`);
  }
  if (config.STRIPE_SECRET_KEY !== 'sk_test_not_configured') {
    throw new Error('Real Stripe keys are not allowed in this local baseline.');
  }
  const childEnv = { ...process.env };
  // Keep platform PATH, proxy and certificate configuration. Remove inherited
  // application credentials, Docker remote selectors, and runtime overrides.
  const blocked = /^(?:PSI_|DATABASE_|DIRECT_URL$|POSTGRES_|PG(?:HOST|PORT|USER|PASSWORD|DATABASE|SERVICE|SSLMODE)|PRISMA_|NEXT_|NEXTAUTH_|SMTP_|AWS_|S3_|AZURE_|BLOB_|GOOGLE_|STRIPE_|AI_GATEWAY_|ANTHROPIC_|OPENAI_|ABACUS|VERCEL_|FFMPEG_|CRON_|DOWNLOAD_TOKEN_|COMPOSE_|DOCKER_(?:HOST|CONTEXT|TLS|TLS_VERIFY|CERT_PATH)$|NODE_ENV$|NODE_OPTIONS$|DOTENV_)/;
  for (const key of Object.keys(childEnv)) if (blocked.test(key)) delete childEnv[key];
  return { ...childEnv, ...config, AWS_EC2_METADATA_DISABLED: 'true' };
}

function run(program, args, env) {
  const result = spawnSync(program, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${program} failed (${result.status ?? result.signal}).`);
}

function main() {
  if (!commands.includes(command)) throw new Error(`Usage: node scripts/test-environment.mjs ${commands.join('|')}`);
  if (command === 'setup') initialize();
  const env = environment();
  const local = (binary, args) => run(join(root, 'node_modules', '.bin', binary), args, env);
  const compose = (args) => run('docker', ['--host=unix:///var/run/docker.sock', 'compose',
    '--project-name', 'psi-test', '--env-file', envPath, '--file', 'compose.test.yaml', ...args], env);
  switch (command) {
    case 'setup':
      compose(['up', '--detach', '--wait', '--wait-timeout', '90']);
      local('prisma', ['generate']);
      local('prisma', ['db', 'push', '--skip-generate']);
      local('tsx', ['scripts/seed-test.ts']);
      console.log('Local test database ready. Run npm run test:dev; Mailpit is at http://localhost:11225.');
      break;
    case 'seed': local('tsx', ['scripts/seed-test.ts']); break;
    case 'check': local('tsx', ['scripts/test-seed-check.ts']); break;
    case 'mail': local('tsx', ['scripts/test-email-check.ts']); break;
    case 'app': local('tsx', ['scripts/test-app-check.ts']); break;
    case 'dev': local('next', ['dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3001']); break;
    case 'build': local('prisma', ['generate']); local('next', ['build', '--webpack']); break;
    case 'stop': compose(['down']); break;
    case 'status': compose(['ps']); break;
  }
}

try { main(); } catch (error) {
  // Do not print config objects, connection strings, or generated credentials.
  console.error(error instanceof Error ? error.message : 'Test environment command failed.');
  process.exitCode = 1;
}
