import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const scriptPath = resolve(process.argv[1]);
const root = resolve(dirname(scriptPath), '..');

async function checkRenderer() {
  // These imports must happen after the parent starts us with a fresh TMPDIR.
  const { pdfService } = await import('../lib/services/pdf.service');
  const { default: chromium } = await import('@sparticuz/chromium');
  const { default: puppeteer } = await import('puppeteer-core');
  const binary = join(tmpdir(), 'chromium');
  assert.equal(existsSync(binary), false, 'Cold check must not reuse another Chromium version.');

  const empty = await pdfService.generatePDF('   ');
  assert.equal(empty.success, false, 'Empty HTML must be rejected.');
  assert.equal(empty.buffer, undefined);
  assert.equal(existsSync(binary), false, 'Empty input must not launch or unpack a browser.');

  const html = `<!doctype html><html><head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
    <style>@page{size:A4;margin:20mm}body{font-family:sans-serif}.second{break-before:page}</style>
    </head><body><h1>SYNTHETIC PDF CHECK</h1><p>First page content.</p>
    <section class="second"><h2>SECOND PAGE CHECK</h2><p>Second page content.</p></section>
    </body></html>`;
  let binarySnapshot: { ino: number; size: number; mtimeMs: number } | undefined;
  const sizes: number[] = [];
  for (const mode of ['cold', 'warm']) {
    const result = await pdfService.generatePDF(html);
    assert.equal(result.success, true, `${mode} render must succeed.`);
    assert.ok(result.buffer, `${mode} render must return a buffer.`);
    assert.equal(result.buffer.subarray(0, 5).toString(), '%PDF-');
    const file = join(tmpdir(), `${mode}.pdf`);
    writeFileSync(file, result.buffer, { mode: 0o600 });
    const info = execFileSync('pdfinfo', [file], { encoding: 'utf8', timeout: 10_000 });
    assert.match(info, /^Pages:\s+2\s*$/m, 'The explicit page break must produce two pages.');
    const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', timeout: 10_000 });
    const pages = text.split('\f').filter((page) => page.trim());
    assert.equal(pages.length, 2);
    assert.ok(pages[0].includes('SYNTHETIC PDF CHECK') && pages[0].includes('First page content.'));
    assert.ok(pages[1].includes('SECOND PAGE CHECK') && pages[1].includes('Second page content.'));
    sizes.push(result.buffer.length);

    const { ino, size, mtimeMs } = statSync(binary);
    const snapshot = { ino, size, mtimeMs };
    if (mode === 'cold') binarySnapshot = snapshot;
    else assert.deepEqual(snapshot, binarySnapshot, 'Warm render must reuse the verified fresh binary.');
  }

  const executablePath = await chromium.executablePath();
  assert.equal(executablePath, binary);
  const browser = await puppeteer.launch({ executablePath, args: chromium.args, headless: 'shell' });
  let version: string;
  try {
    version = await browser.version();
    assert.match(version, /(?:Chrome|Chromium)\/153\./, 'Check the actual executable version, not just package metadata.');
    const page = await browser.newPage();
    await page.setContent('<input id="address" value="Old synthetic address">');
    const input = await page.$('#address');
    assert.ok(input);
    await input.click({ count: 3 });
    await input.type('New synthetic address');
    assert.equal(await page.$eval('#address', element => (element as HTMLInputElement).value), 'New synthetic address',
      'The map search triple-click must replace the whole existing address.');

  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({
    version, sizes,
    checks: ['empty HTML rejected before browser launch', 'cold and warm two-page PDFs', 'expected text on each page', 'fresh Chromium 153 executable', 'triple-click address replacement'],
  }));
}

async function main() {
  if (process.argv.includes('--isolated-child')) {
    await checkRenderer();
    return;
  }
  const directory = mkdtempSync(join(tmpdir(), 'psi-pdf-render-'));
  // Pass only execution essentials. No application credentials or executable
  // overrides reach the child, and fixture HTML contains no external resources.
  const env: NodeJS.ProcessEnv = { TMPDIR: directory, TMP: directory, TEMP: directory, LC_ALL: 'C', NODE_ENV: 'test' };
  for (const key of ['PATH', 'LD_LIBRARY_PATH', 'SYSTEMROOT']) {
    if (process.env[key]) env[key] = process.env[key];
  }
  try {
    const child = spawnSync(process.execPath, [join(root, 'node_modules/tsx/dist/cli.mjs'), scriptPath, '--isolated-child'], {
      cwd: root, env, encoding: 'utf8', timeout: 180_000,
    });
    if (child.status !== 0) {
      // The child has no application credentials; preserve actionable diagnostics.
      throw new Error(child.error?.message || child.stderr.trim() || 'Isolated PDF renderer check failed.');
    }
    const result = JSON.parse(child.stdout.trim());
    console.log(JSON.stringify(result));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'PDF renderer verification failed.');
  process.exitCode = 1;
});
