# Local test environment

This checkout can run against its own PostgreSQL 17 database and Mailpit email
capture inside the cloud workspace. It contains fictional customer and staff
records plus public service-area content. It does not connect to the production
database. It supports dependency upgrades without credentials for unused
features. The retained inspection/CRM fixtures provide regression coverage;
they do not mean those workflows are used by the business.

## Start and check

Prerequisites: Node.js 24.22.1 (pinned in `.nvmrc`), npm 11.19.1, Docker Engine
and Docker Compose v2. Install dependencies with `npm ci`; no peer bypass is
needed. npm's `package-lock.json` is the authoritative lockfile.

```sh
npm run test:setup
npm run test:data
npm run test:mail
npm run test:dev
```

The app runs at `http://localhost:3001`; email capture is at
`http://localhost:11225`. These addresses refer to the cloud workspace. The
database and email ports bind only to loopback. Use the workspace's port preview
or forwarding feature to view them from another computer.

`test:setup` creates `.env.test.local` with random passwords and permissions 0600,
starts containers, generates Prisma, applies the checked-in schema, and seeds
fixtures. The file is ignored by Git. Existing passwords are retained on reruns.
Do not copy a production environment file into this test checkout. The wrapper
refuses standard Next.js/Prisma environment files to prevent accidental mixing.

| Command | Purpose |
| --- | --- |
| `npm run test:seed` | Restore fixture fields using stable IDs; no broad deletes |
| `npm run test:data` | Check guards, counts, relationships, pricing and scenario coverage |
| `npm run test:mail` | Send synthetic messages to local capture and verify recipient isolation |
| `npm run test:app` | With `test:dev` running, check pages, staff login, jobs and access restrictions |
| `npm run test:build` | Build using the isolated local configuration |
| `npm run test:status` | Show local container status |
| `npm run test:stop` | Stop containers; preserve the database volume |

Reseeding overwrites fields on seeded records, including passwords, status,
schedules, notes and pricing. It is not a backup/restore operation. Records you
add are not broadly deleted. Schedules are refreshed relative to the seed date.
The strict fixture checker expects the baseline state and can fail after manual
workflow edits. Keep `.env.test.local` while retaining the database volume: the
database password is initialized when that volume is first created.

## Staff access and coverage

Use `/admin/login` for management roles or `/technician/login` for technicians
with one of these addresses. The password is the generated
`PSI_TEST_USER_PASSWORD` value in the private `.env.test.local` file; it is never
printed by setup or committed.

| Address | Role |
| --- | --- |
| `technician@example.test` | Technician |
| `manager@example.test` | Manager |
| `admin@example.test` | Admin |
| `owner@example.test` | Owner |
| `superadmin@example.test` | Super admin |
| `inactive@example.test` | Disabled technician; login must fail |

Fixtures include 16 jobs spanning every job status, 12 inspections across the
technician and review stages, profiles/territories, leads, contact submissions,
dispatch messages, tracking tokens, pending/failed media, and report metadata.
Base inspection pricing is $159 with current access and crawl-space fees.
There are also 13 service areas, 7 service offerings, 91 area/service links and
28 FAQs from the public reference data.

Customer addresses are explicitly fictional. Emails use `example.test` and
phone numbers are absent. Media records contain no working storage URLs.
Report text is labeled fixture content, not an AI-generated result. No AI
response, paid checkout, upload, PDF generation or calendar event is represented
as having succeeded by the seed.

## Email behavior

With `PSI_TEST_MODE=true`, the central notification function requires one valid
`PSI_TEST_EMAIL_RECIPIENT`, redirects both customer and admin recipients to that
address, and prefixes subjects with `[PSI TEST]`. Missing recipient or SMTP
configuration blocks sending, including after a transport has been cached.

The local configuration uses `douglastalley1977@gmail.com` as the sole recipient
but delivers messages only to Mailpit at `127.0.0.1:11025`. Nothing reaches that
Gmail inbox. Production SMTP behavior remains unchanged outside test mode.

## External integrations

The wrapper removes inherited application credentials and accepts only its local
configuration fields. External integrations require a separate test configuration;
production keys are rejected by this local wrapper. No production database write,
live email, payment, model call or storage upload is required for these checks.

The Stripe module constructs its client at import time, so the local configuration
uses the invalid value `sk_test_not_configured`. This allows imports but cannot
authenticate or simulate a successful payment. Calendar availability may display
its error/retry state without Google credentials; successful remote responses are
not fabricated.

These commands configure the local workspace only. They do not change Vercel's
Preview environment variables or isolate a deployed Preview's integrations.

## Baseline verification (2026-10-23)

Passed: repeated seed without duplicate fixture records; database guard and data
checks; actual SMTP capture and recipient isolation; current checkout-pricing
checks; five public pages; all active staff logins; inactive-account rejection;
admin/technician job reads and permission restrictions; session logout; repository
ESLint; and the production build including TypeScript validation.

The baseline above preceded the dependency upgrade. See
[dependency upgrade results](DEPENDENCY_UPGRADE_RESULTS.md) for the current
versions and fresh verification.
