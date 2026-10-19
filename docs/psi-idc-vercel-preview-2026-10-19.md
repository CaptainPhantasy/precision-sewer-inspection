# PSI–IDC content for Vercel preview

## Source and release boundary

This preview starts from the website actually published at precisionsewerinspections.com:
`CaptainPhantasy/precision-sewer-inspection`, commit `3830e96baff3fa0bbfdd1ca02baf241a6c47c291`.
The intended content comes from `CaptainPhantasy/PSILIVE`, commit
`b3f33277328825a687d0b62820e949786f7a7e6f`.

Deploy only to Vercel preview. Do not merge or promote this work to production without owner approval.
The production commit and deployment `dpl_HZpC2mFnoqowpQrsvsLvGHMexKeU` remain the rollback reference.

## Included

- Updated homepage, PSI–IDC shared-ownership explanation, optional services, pump inspections,
  recurring blockage investigations, locating descriptions, and customer-choice wording.
- Contractor pre/post-lining inspection page, existing artwork, Google review display,
  pricing descriptions, FAQs, search information, styles, accessibility, and sample report.
- Existing video-review submission and lead-capture handling retained, with the intended
  optional-guidance checkbox and PSI–IDC disclosure added to its existing request message.
- Existing locating request delivery and lead-capture handlers retained exactly.
- Corrected the misspelled Google search link. Contractor project inquiries use the existing
  email address rather than entering consumer inspection checkout.

## Protected production behavior

The checkout form and booking confirmation, all 76 API routes, staff pages, lead-capture hooks,
database schema and seed files, checkout price calculations, payment integration, dependencies,
lockfiles, Next.js configuration, and Vercel configuration remain unchanged.
`lib/constants.ts` changes public descriptions and FAQs; the company/service records and
promotion calculations retain their existing values and behavior.

The Sites build scripts, booking proxy, alternate form-delivery service, hosting registration,
and operational changes in the newer snapshot are not imported into this Vercel application.

## Fresh verification

- Production build passed, including TypeScript validation and page generation.
  Local setup used the existing dependency lockfile with `npm ci --legacy-peer-deps`.
  Local build used a larger Node memory allowance and synthetic test configuration.
- `node --import tsx scripts/checkout-pricing-check.ts` passed.
- Seven rendered routes returned HTTP 200 and the expected content: home, services,
  inspection-and-service, contractors/lateral-lining-inspections, contact, video-review, locating.
- Byte comparisons confirmed the protected production files above remained unchanged.
- `git diff --check` passed.

These are build, local render, pricing, and preservation checks. They are not proof of live
payment, email delivery, or appointment creation. No real transaction was performed.
Browser interaction verification will be reported separately from these checks.

## Quarantine

The first local build rewrote yarn.lock automatically. Its generated version was copied to the
ignored `.quarantine/generated-yarn.lock`, and the original committed lockfile was restored.
No project files were deleted.
