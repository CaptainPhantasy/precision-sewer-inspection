/** This fixture writer is intentionally restricted to the dedicated local test database. */
export function assertTestDatabase(env: Record<string, string | undefined> = process.env): string {
  if (env.PSI_TEST_MODE !== 'true') {
    throw new Error('Set PSI_TEST_MODE=true to use the isolated test database.');
  }

  let url: URL;
  try {
    url = new URL(env.DATABASE_URL ?? '');
  } catch {
    throw new Error('DATABASE_URL must identify the isolated local test database.');
  }

  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.port !== '55432' ||
    url.username !== 'psi_test' ||
    url.pathname !== '/psi_test' ||
    !url.password ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    // Do not echo the supplied URL: it contains a password.
    throw new Error('Test data requires PostgreSQL at localhost or 127.0.0.1:55432, user/database psi_test, a password, and no URL query or fragment.');
  }
  return url.toString();
}

export function requireTestUserPassword(env: Record<string, string | undefined> = process.env): string {
  const password = env.PSI_TEST_USER_PASSWORD;
  if (!password || password.length < 16 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Provide PSI_TEST_USER_PASSWORD with at least 16 characters and at most 72 UTF-8 bytes.');
  }
  return password;
}
