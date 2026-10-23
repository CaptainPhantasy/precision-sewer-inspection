import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluatePreviewChecks } from './verify-preview.mjs';

const head = 'a'.repeat(40);
function green() {
  return {
    head,
    observedHead: head,
    statusHead: head,
    combinedState: 'success',
    checkRuns: [{ name: 'GitGuardian Security Checks', app: { slug: 'gitguardian' },
      head_sha: head, status: 'completed', conclusion: 'success' }],
    statuses: [{ id: 2, context: 'Vercel', state: 'success', created_at: '2026-10-23T14:00:00Z' }],
  };
}

test('a successful Vercel build cannot conceal a failed secret scan', () => {
  const input = green();
  input.checkRuns[0].conclusion = 'failure';
  assert.equal(evaluatePreviewChecks(input).ok, false);
});

test('required checks must exist and be from the expected scanner app', () => {
  assert.equal(evaluatePreviewChecks({ ...green(), checkRuns: [] }).ok, false);
  assert.equal(evaluatePreviewChecks({ ...green(), statuses: [] }).ok, false);
  const input = green();
  input.checkRuns[0].app.slug = 'unrelated-app';
  assert.equal(evaluatePreviewChecks(input).ok, false);
});

test('a changed PR head or mismatched check/status commit rejects stale evidence', () => {
  assert.equal(evaluatePreviewChecks({ ...green(), observedHead: 'b'.repeat(40) }).ok, false);
  assert.equal(evaluatePreviewChecks({ ...green(), statusHead: 'b'.repeat(40) }).ok, false);
  const input = green();
  input.checkRuns[0].head_sha = 'b'.repeat(40);
  assert.equal(evaluatePreviewChecks(input).ok, false);
});

test('pending, neutral, skipped, and failed additional checks never pass', () => {
  for (const conclusion of [null, 'neutral', 'skipped', 'failure', 'cancelled']) {
    const input = green();
    input.checkRuns.push({ name: 'Additional validation', app: { slug: 'github-actions' },
      head_sha: head, status: conclusion ? 'completed' : 'in_progress', conclusion });
    assert.equal(evaluatePreviewChecks(input).ok, false, String(conclusion));
  }
  const input = green();
  input.statuses.push({ id: 3, context: 'Another status', state: 'pending' });
  assert.equal(evaluatePreviewChecks(input).ok, false);
});

test('only the newest status in each context determines that context result', () => {
  const input = green();
  input.statuses.push({ id: 1, context: 'Vercel', state: 'failure', created_at: '2026-10-23T13:00:00Z' });
  assert.equal(evaluatePreviewChecks(input).ok, true);
  input.statuses.push({ id: 3, context: 'Vercel', state: 'failure', created_at: '2026-10-23T15:00:00Z' });
  assert.equal(evaluatePreviewChecks(input).ok, false);
});

test('unavailable/malformed status data fails closed', () => {
  assert.equal(evaluatePreviewChecks({ ...green(), statuses: undefined }).ok, false);
  assert.equal(evaluatePreviewChecks({ ...green(), checkRuns: undefined }).ok, false);
  assert.equal(evaluatePreviewChecks({ ...green(), combinedState: 'pending' }).ok, false);
  assert.equal(evaluatePreviewChecks({ ...green(), statuses: [{ context: 'Vercel', state: 'success' }] }).ok, false);
});

test('all required and additional checks green on an unchanged commit pass', () => {
  const input = green();
  input.checkRuns.push({ name: 'Tests', app: { slug: 'github-actions' }, head_sha: head,
    status: 'completed', conclusion: 'success' });
  input.statuses.push({ id: 3, context: 'Other validation', state: 'success' });
  assert.deepEqual(evaluatePreviewChecks(input).problems, []);
  assert.equal(evaluatePreviewChecks(input).ok, true);
});
