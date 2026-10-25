# Paused browser compatibility investigation

**Purpose:** determine whether Puppeteer 25.16.0 could use its officially matched Chrome 156.0.8078.47 on Vercel, replacing the tested serverless Chromium 153 runtime.

**Work completed:** checked published versions, verified Google's official Chrome download, and tested real cold/warm PDF generation in an isolated Amazon Linux 2023 / Node 24 container. Built a prototype archive containing Chrome and its native libraries.

**Findings:** PDF and text checks passed with 1 GB memory and 512 MB temporary storage. The prototype archive was about 145 MB, extraction took about 3 seconds, and peak memory was about 700 MB. No newer Sparticuz package was available. Downgrading Puppeteer to match Chromium 153 would reintroduce a known dependency advisory, so that option was rejected.

**Stopped before:** actual Vercel Preview verification, final packaging/provenance review, or application integration. No experimental browser, dependency, runtime setting, or diagnostic endpoint was deployed. The existing tested runtime remains in use.

**Resume:** evidence and scripts are in `/workspace/scratch/psi-verification/browser-compatibility/`, especially `FINDINGS.md` and `prototype/`. Start with `Dockerfile.pinned`, `build-archive.py`, `stage-archive.cjs`, `run-archive-container.py`, and the `al2023-archive-pdf-verification.json` results. A successful Vercel Preview cold/warm test is still required before considering a production change.
