import assert from 'node:assert/strict';
import { get as httpGet } from 'node:http';
import { assertTestDatabase, requireTestUserPassword } from './test-data/guard';

async function main() {
  assertTestDatabase();
  const password = requireTestUserPassword();
  const base = 'http://127.0.0.1:3001';
  const request = (path: string, options: RequestInit = {}) => fetch(`${base}${path}`, {
    ...options, redirect: 'manual', signal: AbortSignal.timeout(60_000),
  });

  const publicPages = ['/', '/areas', '/contact', '/resources/sewer-maintenance-tips', '/sewer-inspection/indianapolis-in', '/admin/login', '/technician/login'];
  for (const path of publicPages) {
    const response = await request(path);
    assert.equal(response.status, 200, `Public page ${path}`);
    assert.ok((await response.text()).length > 100, `Public page ${path} must render`);
  }
  // Node fetch normalizes Host, so use HTTP directly to exercise the proxy.
  const canonical = await new Promise<{ status: number | undefined; location: string | undefined }>((resolve, reject) => {
    const call = httpGet(`${base}/contact?source=upgrade-check`, { headers: { Host: 'www.precisionsewerinspections.com' } }, (response) => {
      response.resume();
      resolve({ status: response.statusCode, location: response.headers.location });
    });
    call.setTimeout(10_000, () => call.destroy(new Error('Canonical redirect check timed out')));
    call.on('error', reject);
  });
  assert.equal(canonical.status, 301, 'Canonical host redirect');
  assert.equal(canonical.location, 'https://precisionsewerinspections.com/contact?source=upgrade-check', 'Canonical redirect preserves path/query without internal server port');
  assert.equal((await request('/api/admin/jobs')).status, 401, 'Anonymous users must not read jobs');

  for (const [name, role] of [
    ['technician', 'TECHNICIAN'], ['manager', 'MANAGER'], ['admin', 'ADMIN'],
    ['owner', 'OWNER'], ['superadmin', 'SUPER_ADMIN'], ['inactive', 'TECHNICIAN'],
  ]) {
    const login = await request('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${name}@example.test`, password }),
    });
    if (name === 'inactive') {
      assert.equal(login.status, 401, 'Inactive fixture must not sign in');
      continue;
    }
    assert.equal(login.status, 200, `${role} sign-in`);
    const body = await login.json();
    assert.equal(body.user?.role, role, `${role} returned role`);
    const cookie = login.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
    assert.ok(cookie, `${role} must receive a session cookie`);
    const headers = { Cookie: cookie };
    try {
      const adminJobs = await request('/api/admin/jobs', { headers });
      if (['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(role)) {
        assert.equal(adminJobs.status, 200, `${role} jobs access`);
        assert.equal((await adminJobs.json()).pagination.total, 16, `${role} seeded job count`);
      } else {
        assert.equal(adminJobs.status, 401, `${role} must not gain admin job access`);
      }
      if (name === 'technician') {
        const result = await request('/api/technician/jobs?includeCompleted=true', { headers });
        assert.equal(result.status, 200, 'Technician jobs access');
        const data = await result.json();
        assert.equal(data.jobs.length, 9, 'Technician active jobs');
        assert.equal(data.rejectedJobs.length, 1, 'Technician rejected inspections');
        assert.equal(data.completedJobs.length, 2, 'Technician completed history');
      }
      const invalidInputPaths = name === 'admin'
        ? ['/api/admin/overrides/synthetic-invalid/approve', '/api/admin/overrides/synthetic-invalid/deny']
        : name === 'technician' ? ['/api/technician/inspections/synthetic-invalid/override'] : [];
      for (const path of invalidInputPaths) {
        const invalid = await request(path, { method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' });
        assert.equal(invalid.status, 400, 'Invalid input must be rejected before any record change.');
        const body = await invalid.json();
        assert.ok(Array.isArray(body.details) && body.details.length > 0, 'Validation issues must be returned.');
      }
    } finally {
      assert.equal((await request('/api/auth/logout', { method: 'POST', headers })).status, 200, `${role} logout`);
      assert.equal((await request('/api/auth/me', { headers })).status, 401, `${role} session invalidated`);
    }
  }
  console.log(`PASS: ${publicPages.length} public pages, canonical redirect, all five staff roles, inactive-account rejection, job reads, access restrictions and logout.`);
  console.log('Only local synthetic accounts were used; no external integration was called.');
}

main().catch((error: unknown) => {
  console.error('Local app check failed (start npm run test:dev first):', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});
