import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const scanner = '@secretlint/quick-start@13.0.7';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const scratch = mkdtempSync(join(tmpdir(), 'psi-secret-scan-'));
const snapshots = [];
const labels = new Map();

try {
  const [mode, base = 'origin/main', head] = process.argv.slice(2);
  if (mode === '--staged' && !head) {
    // Scan the exact index tree, including all PR changes relative to the base.
    const tree = git('write-tree').trim();
    snapshots.push({ tree, base });
    console.log(`Checking staged tree ${tree} against ${base}`);
  } else if (mode === '--range' && head) {
    // Include every outgoing commit, even when a later commit deletes a secret.
    git('merge-base', '--is-ancestor', base, head);
    for (const commit of git('rev-list', '--reverse', `${base}..${head}`).trim().split('\n').filter(Boolean)) {
      snapshots.push({ tree: commit, base: `${commit}^` });
    }
  } else {
    throw new Error('Usage: node scripts/check-secrets.mjs --staged [base] | --range base head');
  }

  let policyFailures = 0;
  for (const [index, snapshot] of snapshots.entries()) {
    const paths = git('diff', '--name-only', '--diff-filter=ACMRT', '-z', snapshot.base, snapshot.tree).split('\0').filter(Boolean);
    for (const path of paths) {
      if (/(^|\/)(?:\.private|\.vercel)(\/|$)|(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example')) {
        console.error(`BLOCKED: private configuration path ${path}`);
        policyFailures++;
        continue;
      }
      const content = git('show', `${snapshot.tree}:${path}`);
      for (const [lineIndex, line] of content.split('\n').entries()) {
        const smtpHost = /\bSMTP_HOST\s*:\s*["']([^"']+)["']/.exec(line)?.[1];
        if (path.startsWith('scripts/test-') && smtpHost && !['127.0.0.1', 'localhost', '::1'].includes(smtpHost)) {
          console.error(`BLOCKED: local test SMTP host must be loopback at ${path}:${lineIndex + 1}`);
          policyFailures++;
        }
        if (path === 'scripts/test-email-check.ts' && /["'`](?:PASS|PASSWD|PASSWORD)\s*:/.test(line)) {
          console.error(`BLOCKED: ambiguous password-shaped test label at ${path}:${lineIndex + 1}`);
          policyFailures++;
        }
        // These exact false-positive forms caused the original PR failure.
        // Use generated fixture values and plain required-variable references.
        if (/\b(?:SMTP_PASSWORD|POSTGRES_PASSWORD)\s*:\s*["'][^"']+["']/.test(line) ||
            /\bSMTP_PASSWORD\s*:\s*[A-Za-z_$][\w$]*\s*[,}]/.test(line) ||
            /\bSMTP_PASSWORD\s*:\s*[A-Za-z_$][\w$]*\([^)]*\)\s*\}/.test(line) ||
            /\bPOSTGRES_PASSWORD\s*:\s*\$\{[A-Z_]+:\?[^}]+\}/.test(line)) {
          console.error(`BLOCKED: literal or ambiguous credential assignment at ${path}:${lineIndex + 1}`);
          policyFailures++;
        }
      }
      const file = join(scratch, String(index), path);
      mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
      writeFileSync(file, content, { mode: 0o600 });
      labels.set(file, path);
    }
  }
  if (policyFailures) throw new Error(`${policyFailures} credential policy finding(s); no secret values printed.`);
  if (labels.size) {
    const env = { ...process.env };
    for (const key of Object.keys(env)) {
      if (/TOKEN|SECRET|PASSWORD|CREDENTIAL|DATABASE_URL|^(?:AWS_|VERCEL_|GH_|GITHUB_|STRIPE_|SMTP_|GOOGLE_|ANTHROPIC_|OPENAI_)/i.test(key)) delete env[key];
    }
    const result = spawnSync('npx', ['--yes', '--ignore-scripts', scanner, '--no-glob', '--no-gitignore', '--format=json', ...labels.keys()], {
      cwd: scratch, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 180000,
    });
    let report;
    try { report = JSON.parse(result.stdout || ''); } catch { throw new Error('Secret scanner unavailable or returned an invalid report; publishing is blocked.'); }
    if (!Array.isArray(report)) throw new Error('Unexpected secret scanner report; publishing is blocked.');
    let findings = 0;
    for (const file of report) {
      for (const message of file.messages || []) {
        console.error(`BLOCKED: ${labels.get(file.filePath) || 'scanned file'}:${message.line ?? '?'} (${message.ruleId || 'secret scanner'})`);
        findings++;
      }
    }
    if (result.status !== 0 || findings) throw new Error(`Secret scan failed (${findings} finding(s)); no secret values printed.`);
  }
  console.log(`PASS: ${labels.size} changed file snapshot(s) scanned with ${scanner}.`);
} catch (error) {
  // Never print subprocess stderr: a detector or Git error could contain data.
  console.error(error instanceof Error && !('stderr' in error) ? error.message : 'Pre-push verification failed; publishing is blocked.');
  process.exitCode = 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
