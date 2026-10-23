import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const repository = 'CaptainPhantasy/precision-sewer-inspection';
const shaPattern = /^[a-f0-9]{40}$/i;
const label = (value) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0,160)
  : '(missing)';

function newestStatuses(statuses) {
  const byContext = new Map();
  for (const status of statuses) {
    const previous = byContext.get(status.context);
    const newer = !previous || Number(status.id) > Number(previous.id)
      || (Number(status.id) === Number(previous.id)
        && Date.parse(status.created_at) > Date.parse(previous.created_at));
    if (newer) byContext.set(status.context, status);
  }
  return [...byContext.values()];
}

/** Only an explicit success from every current check is a pass. */
export function evaluatePreviewChecks({ head, observedHead, statusHead, combinedState, checkRuns, statuses }) {
  const problems = [];
  const checks = [];
  if (!shaPattern.test(head || '') || observedHead !== head || statusHead !== head) {
    problems.push('The PR head changed, is invalid, or does not match the status response.');
  }
  if (!Array.isArray(checkRuns) || !Array.isArray(statuses)) {
    return { ok: false, problems: [...problems, 'Check or status data is unavailable.'], checks };
  }
  if (combinedState !== 'success') problems.push(`Combined commit status: ${label(combinedState)}.`);

  let hasGitGuardian = false;
  for (const check of checkRuns) {
    const name = label(check?.name);
    const app = label(check?.app?.slug);
    const state = `${label(check?.status)}/${label(check?.conclusion)}`;
    checks.push({ kind: 'check', name, app, state });
    if (!check || typeof check.name !== 'string' || check.head_sha !== head) {
      problems.push(`Check ${name} is malformed or belongs to a different commit.`);
    }
    if (check?.status !== 'completed' || check?.conclusion !== 'success') {
      problems.push(`Check ${name}: ${state}.`);
    }
    if (check?.name === 'GitGuardian Security Checks' && check?.app?.slug === 'gitguardian') {
      hasGitGuardian = true;
    }
  }
  if (!hasGitGuardian) problems.push('Required GitGuardian Security Checks from the gitguardian app is missing.');

  if (statuses.some((status) => !status || typeof status.context !== 'string'
    || !Number.isSafeInteger(status.id))) {
    problems.push('Commit status data is malformed.');
  }
  const validStatuses = statuses.filter((status) => status && typeof status.context === 'string'
    && Number.isSafeInteger(status.id));
  const latest = newestStatuses(validStatuses);
  for (const status of latest) {
    const name = label(status.context);
    const state = label(status.state);
    checks.push({ kind: 'status', name, state });
    if (status.state !== 'success') problems.push(`Status ${name}: ${state}.`);
  }
  if (!latest.some((status) => status.context === 'Vercel')) {
    problems.push('Required Vercel commit status is missing.');
  }
  return { ok: problems.length === 0, problems, checks };
}

async function githubRead(endpoint, paginated = false) {
  const args = ['api', '--method', 'GET', '-H', 'Accept: application/vnd.github+json',
    '-H', 'X-GitHub-Api-Version: 2022-11-28'];
  // @json emits one compact JSON object per page, including on older gh versions
  // that do not implement --slurp.
  if (paginated) args.push('--paginate', '--jq', '@json');
  args.push(endpoint);
  try {
    const { stdout } = await execFileAsync('gh', args, { maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
    return paginated
      ? stdout.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
      : JSON.parse(stdout);
  } catch (error) {
    // gh error output and response bodies may contain annotations; do not echo them.
    const code = /HTTP (\d{3})/.exec(String(error?.stderr || ''))?.[1];
    const detail = code ? ` (HTTP ${code})` : error?.killed ? ' (request timed out)' : '';
    throw new Error(`GitHub API verification is unavailable${detail}. Check gh authentication/connectivity and rerun.`);
  }
}

function flattenPages(pages, field, head) {
  if (!Array.isArray(pages) || pages.length === 0 || pages.some((page) => !page
    || !Array.isArray(page[field]) || !Number.isSafeInteger(page.total_count)
    || page.total_count < 0 || (field === 'statuses' && page.sha !== head))) {
    throw new Error(`Incomplete or mismatched paginated ${field} response.`);
  }
  const records = pages.flatMap((page) => page[field]);
  if (records.length < Math.max(...pages.map((page) => page.total_count))) {
    throw new Error(`Not all ${field} results were retrieved.`);
  }
  return records;
}

async function main(args) {
  if (args.length > 1 || (args[0] && !/^[1-9]\d*$/.test(args[0]))) {
    throw new Error('Usage: node scripts/verify-preview.mjs [pull-request-number]');
  }
  const prNumber = args[0] || '13';
  const prEndpoint = `repos/${repository}/pulls/${prNumber}`;
  const before = await githubRead(prEndpoint);
  const head = before?.head?.sha;
  if (!shaPattern.test(head || '') || typeof before?.head?.ref !== 'string'
    || before?.head?.repo?.full_name !== repository) {
    throw new Error('The pull request head is missing or outside the expected repository.');
  }
  const commitEndpoint = `repos/${repository}/commits/${head}`;
  const results = await Promise.allSettled([
    githubRead(`${commitEndpoint}/check-runs?filter=latest&per_page=100`, true),
    githubRead(`${commitEndpoint}/status?per_page=100`, true),
  ]);
  if (results.some((result) => result.status !== 'fulfilled')) {
    throw new Error('GitHub API verification is unavailable; no checks have been accepted as passed.');
  }
  const checkPages = results[0].value;
  const statusPages = results[1].value;
  const checkRuns = flattenPages(checkPages, 'check_runs', head);
  const statuses = flattenPages(statusPages, 'statuses', head);
  const after = await githubRead(prEndpoint);
  const result = evaluatePreviewChecks({
    head,
    observedHead: after?.head?.sha,
    statusHead: statusPages[0].sha,
    combinedState: statusPages.every((page) => page.state === 'success') ? 'success' : 'not-success',
    checkRuns,
    statuses,
  });
  console.log(JSON.stringify({ repository, pr: Number(prNumber), branch: label(before.head.ref),
    commit: head, ...result }, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : 'Preview verification failed.');
    process.exitCode = 1;
  });
}
