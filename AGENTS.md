# Publishing and verification requirements

These requirements apply to every assistant working in this repository. They
record the owner's instruction after PR #13 was reported ready while its
GitGuardian check was failing.

## Before publishing any Git objects or updating a remote branch

1. Inspect the exact diff and preserve unrelated work. Never stage private
   environment files, credentials, customer-data reviews or authentication state.
2. Stage the intended snapshot and run
   `node scripts/check-secrets.mjs --staged origin/main`. Record its tree SHA.
   Publish that exact tree only. Any edit invalidates the scan. A failed or
   unavailable scanner blocks publishing. Never disable detection to get green.
3. Run the checks appropriate to the change. Dependency/runtime changes require
   clean install, lint, type checking, build and relevant behavior checks. Test
   integration changes against the isolated local database/Mailpit environment.
4. For ordinary Git pushes, enable the additional guard with
   `git config core.hooksPath .githooks`. It scans every outgoing commit, including
   secrets removed by a later commit. Do not use `--no-verify`.
5. GitHub connector/API uploads bypass Git hooks. They still require the same
   staged-tree scan before upload. A hook is not server-side branch protection.

## After every push or remote branch update

1. Stay with the deployment until its final result. Inspect build logs on any
   failure, fix the cause, and repeat verification for the new commit.
2. Run `node scripts/verify-preview.mjs <PR-number>` for the current remote head.
   This checks both GitHub status contexts and check runs, including GitGuardian.
   Vercel success alone is insufficient. Missing, pending, failed or unavailable
   checks block a completion claim. Re-read the head to reject stale evidence.
3. Check PR bot findings and review comments. Explain and remediate each security
   finding based on its source. Do not dismiss or suppress a finding simply to
   pass. Rotate real exposed credentials; do not rotate a fabricated test value.
4. Verify Vercel's READY deployment belongs to that exact commit, branch, project
   and Preview environment. Perform relevant smoke checks and inspect runtime
   errors. Do not create production records or send live notifications for
   dependency verification.
5. Report the exact commit, PR, deployment URL and check results. Distinguish
   build success from complete verification. If blocked, name the unresolved
   check; do not claim the Preview is fully verified.

## Production boundary

Target upgrade PRs directly at `main`, never at another temporary upgrade
branch. Verify the base when opening or updating each PR. If a PR includes a
previously verified, unmerged stage, state the required merge order explicitly;
deleting a merged stage's branch must not close the next PR.

Keep `main` and production unchanged until the owner approves the concrete
Preview. Record the production deployment and commit before release. Never
force-push `main`. A history repair on an assistant-owned, unmerged Preview
branch must preserve the old commits locally and use an exact expected-head
lease; never overwrite someone else's new commits.
