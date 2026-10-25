# Security upgrade checkpoints

Each upgrade is committed separately after local checks, then verified in a
Vercel Preview before the next stage starts. Production is released only after
owner review. These stages do not change database models or production records.
Every PR targets `main` directly. Pending prerequisites are listed in its
description so deleting a merged upgrade branch cannot close a later PR.

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

## 3. Puppeteer and Chromium

- Baseline commit: `bde2cb6303e47d2a95be7fded8de6decc08cabf9`.
- Remote rollback tag: `rollback/2026-10-25-before-puppeteer25`.
- Branch: `codex/puppeteer25-security`, based on the verified Zod stage.
- Puppeteer Core `24.43.1` to `25.16.0`; serverless Chromium `148.0.0` to `153.0.0`.
- PDF rendering explicitly selects headless shell. Map-search triple-click uses
  the current `count` option; its whole-field replacement is checked locally.
- The real PDF-service check uses a fresh temporary directory, verifies the actual
  browser is Chromium 153, rejects empty input before launching, and checks cold
  and warm two-page PDFs with `pdfinfo` and `pdftotext`. No database, storage,
  calendar, payment or email calls are involved. Run with
  `npx tsx scripts/pdf-render-check.ts` (Poppler utilities must be installed).
- Compatibility limit: Puppeteer 25.16's reference Chrome revision is 156, while
  153 is the newest available serverless Chromium package. The application's
  exercised PDF/browser paths are tested against the actual 153 executable;
  this is not a claim that the vendor officially matches those revisions.
- The old ZIP/FTP/proxy dependencies and nested Zod 3 copy are removed. Audit now
  reports zero high/critical findings and one moderate CSS-parser package entry.
  npm audit does not assess the Chromium executable's own vulnerability status.

Rollback: revert this stage's commit or use its pre-edit tag. No database schema
change or restoration is required. Merge the prerequisite stages first.

## 4. Tailwind 4

- Baseline commit: `44df3b97381664b7048cf6c584b9e1a0b60b54a9`.
- Remote rollback tag: `rollback/2026-10-25-before-tailwind4`.
- A verified private Git bundle also preserves the complete pre-edit history.
- Branch: `codex/tailwind4-security`, targeting `main`.
- Tailwind `3.3.3` to `4.3.3`, its PostCSS plugin at `4.3.3`, and class merging
  `2.5.2` to `3.7.0`. Tailwind handles prefixing; direct Autoprefixer is removed.
- Split CSS imports keep utilities unlayered, preserving their precedence
  against the existing PSI stylesheets, including link colors and underlines.
- Equivalent shadow, radius, outline, flex and backdrop utility names retain
  previous behavior. Utility gradients explicitly retain sRGB interpolation.
- Border, ring, placeholder and button defaults retain the prior behavior.
- The used standard color families retain their existing hex values in
  `tailwind-colors.json`. The chat input explicitly retains its white surface.
- Homepage FAQ spacing retains top margins between cards: Tailwind 4's changed
  `space-y` selector otherwise conflicts with the existing card bottom margins
  and shortens the section by 16px.
- `npx tsx scripts/class-merge-check.ts` verifies component override behavior;
  the old merger failed the new outline-utility case and the new merger passes.
- Desktop and mobile reference captures cover public pages, chat, navigation,
  theme switching, FAQ, booking validation and the calendar error/retry state.
  The existing clipped booking step indicator at 375/390px is a separate issue
  already documented in `docs/contact-page-issue.md`.
- Modern browser floor: Safari 16.4, Chrome 111, Firefox 128. The old IE entry
  in browserslist does not make the current Next/React/Tailwind stack support IE.
- The old selector-parser chain is removed. Fresh npm audit reports zero
  known affected package entries; this is not a comprehensive security guarantee.

Rollback: revert this stage's commit or use its pre-edit tag. No database schema
change or restoration is required. Merge the prerequisite stages first.
