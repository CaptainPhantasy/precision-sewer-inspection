# Security upgrade checkpoints

Each upgrade is committed separately after local checks, then verified in a
Vercel Preview before the next stage starts. Production is released only after
owner review. These stages do not change database models or production records.

## 1. Prisma 7

- Baseline commit: `075c316a11e89c518881e7498340459f0d042b1e`.
- Remote rollback tag: `rollback/2026-10-25-before-prisma7`.
- Retained production deployment: `dpl_7XD7b6FwEiZh5CY9axsTxh4X875W`.
- Branch: `codex/prisma7-security`.
- CLI, client and PostgreSQL adapter pinned to stable `7.10.1`.
- All application database access uses the shared adapter-backed client. Scripts
  retain separately owned clients and explicit disconnects. Test clients still
  require the guarded local URL before constructing a connection.
- Standalone seed/export scripts explicitly load dotenv before constructing their
  client; a subprocess regression checks this without opening a database connection.
- Prisma CLI settings move to `prisma.config.ts`; credential-free generation
  during clean installation still works. Model definitions are unchanged.
- Browser override labels/types move into a database-free contract module so
  the PostgreSQL driver never enters those browser imports.
- Existing chart dependency versions are preserved with scoped overrides.
- PostgreSQL connections retain TLS verification, enable channel binding, and
  have a bounded connection timeout.

Local evidence: clean installation, dependency tree, lint, type checking,
production build, isolated fixture/database checks with real transaction
rollback, SMTP capture, checkout pricing, seven public pages, all five active
staff roles, disabled-account rejection, access checks, and session logout.
Remote build, security review, calendar/public database reads and browser
verification are recorded in the PR after deployment completes.

Audit after this stage: 10 affected package entries (9 high, 1 moderate,
0 critical). Prisma/deepmerge findings are removed; Zod, Puppeteer and CSS
parser findings remain for their later stages. Counts can change as advisories
are updated and are not counts of demonstrated application exploits.

Rollback: before merge, leave this Preview unmerged and use the baseline tag.
After release, restore the retained Vercel production deployment and revert the
Prisma commit through a PR; do not force-push main. No database restoration or
reverse migration is needed because no database model changed.

## 2. Zod 4

- Baseline commit: `3d9b057d95cba10fd091b61d7cc9d274b4360f80`.
- Remote rollback tag: `rollback/2026-10-25-before-zod4`.
- Branch: `codex/zod4-security`, based on the verified Prisma script follow-up.
- Direct Zod version: `3.25.76` to `4.6.7`.
- Four validation-error readers use the supported `issues` field. Schema defaults,
  optional/null fields, input limits, and caller-facing field errors are retained.
- A focused regression passed on Zod 3, reproduced the changed error-field failure
  on Zod 4, then passed after the compatibility fix. Local API checks reject invalid
  override inputs with HTTP 400 and an issues array before changing any records.
- The old Zod copy under Puppeteer's Chromium BiDi remains until the Puppeteer
  stage. Audit still reports 10 affected package entries (9 high, 1 moderate),
  but the direct application Zod dependency is no longer flagged.

Rollback: revert the Zod-stage commit or use its pre-edit tag; no schema changes
or database restoration are involved. Merge the Prisma script follow-up first.
