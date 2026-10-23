# Dependency upgrade results — 2026-10-23

This is the first dependency upgrade checkpoint for a separate Vercel Preview.
Merging into `main` and releasing to production require review of that preview.
Credentials for abandoned features were not prerequisites for this work.

## Main changes

| Component | Before | Checkpoint version |
| --- | --- | --- |
| Node.js | 24.19.0 | 24.22.1 |
| npm | 11.9.0 | 11.19.1 |
| Next.js | 14.2.35 | 16.4.2 |
| React / React DOM | 18.2.0 | 19.3.1 |
| TypeScript | 5.2.2 | 6.0.3 |
| ESLint | 9.39.4 | 10.13.0 |
| Prisma CLI / client | 6.7.0 | 6.19.3 |
| Nodemailer | 8.0.7 | 10.2.1 |

Node/npm versions are pinned in `.nvmrc` and `package.json`. The cloud workspace
has an isolated installation at `/workspace/.tools/psi-node24/node_modules/.bin`;
verification commands prepend that path. This does not replace the managed
workspace's default Node binary or change the production runtime.

npm's `package-lock.json` is now the single dependency lock; the obsolete Yarn
lock/config was removed. A clean `npm ci` works without `--legacy-peer-deps` or
`--force`. `vercel.json` specifies `npm ci` for deployments.

## Compatibility edits

- Blog route and metadata await Next16 route parameters.
- `middleware.ts` became `proxy.ts`. Canonical www redirects use the public Host
  authority, preserving path/query without leaking an internal server port.
- Builds/dev explicitly use Webpack to retain the existing custom configuration.
- React19 JSX types, the public theme-provider type export and Nodemailer10's
  bundled types replace the old imports.
- Calendar/resizable wrappers adapt new APIs while preserving current callers.
- Tailwind's animation plugin uses an ES import so Node24's TypeScript loader
  does not crash development startup.
- Next16's required JSX/type configuration is retained. Automatic generation of
  agent-instruction files is disabled to avoid unrelated repository changes.

No application feature was removed. Abandoned PWA/CRM feature removal and
booking-email behavior changes are outside this checkpoint.

## Remaining vulnerability findings

| Audit scope | Critical | High | Moderate | Total affected package entries |
| --- | ---: | ---: | ---: | ---: |
| Before upgrade, all dependencies | 4 | 33 | 6 | 44 (also 1 low) |
| After upgrade and compatible transitive patches | 0 | 16 | 1 | 17 |
| After upgrade, production dependency tree (`--omit=dev`) | 0 | 10 | 0 | 10 |

Counts include parent packages affected through shared dependencies; they are not
counts of distinct demonstrated exploits. npm audit does not assess the Node or
Chromium executable or prove that an advisory is reachable in this application.

| Remaining group | Why it remains | Follow-up |
| --- | --- | --- |
| Prisma6.19.3 | Configuration dependency pins vulnerable deepmerge-ts7.1.5. It appears in the production audit through the client peer relationship despite Prisma being declared dev. | Prisma7 client/config/Postgres-adapter migration; can be tested locally. |
| Puppeteer24.43.1 | Browser installer and proxy/FTP dependencies include vulnerable extract-zip/basic-ftp. | Puppeteer25 migration and compatible Chromium/PDF checks; no production credentials needed. Chromium148 also remains behind the observed153 release. |
| Tailwind3.3.3 | Glob/watcher/braces dependencies and selector-parser6 remain affected. | Tailwind4 styling/build migration with visual regression checks. |
| Next lint plugin16.4.2 | Even this current release depends on fast-glob/micromatch/braces. Latest braces3.0.3 has no patched release. | Track an upstream fix or an explicitly reviewed replacement. Do not accept audit's suggested downgrade to unsupported Next14 tooling. |

The newly selected Next, React, TypeScript, ESLint and Nodemailer versions are not
themselves flagged in this audit. This is not a claim that all their dependencies
or all application behavior are vulnerability-free. Prisma7, Puppeteer25 and
Tailwind4 remain separate migrations; selecting patched versions in existing
major lines did not resolve every advisory. TypeScript6 was selected because the
current lint parser does not yet support TypeScript7.

Compatible transitive patches were applied for baseline-browser-mapping,
browserslist, brace-expansion, fast-uri, js-yaml, qs and ws. This reduced the
intermediate audit from24 entries to17.

## Verification

Passed on the upgraded local tree: clean `npm ci` without bypass flags; clean
`npm ls --all`; ESLint; TypeScript; production build; database/fixture checks;
captured SMTP isolation; checkout pricing; seven public pages including the blog;
canonical www redirect; all five staff roles; disabled-account rejection; job
access rules; and logout/session invalidation.

Real Chromium checks passed for desktop/mobile rendering and hydration, chat
open/close, booking required-field validation and navigation to the calendar.
No JavaScript exceptions were recorded. Requests to external services and local
POSTs were blocked during these browser checks.

Calendar availability displays the expected error/retry state because local
Google credentials are not configured. Live calendar, payment, model and cloud
storage operations were not exercised. There are no simulated successful model
responses or fabricated payment/calendar results. These coverage limits did not
block installation, compilation or testing of the locally available behavior.

The advisory findings above remain unresolved despite these passing checks.
Raw command and browser evidence is under `/workspace/scratch/psi-upgrade`.

## Exact direct-package version changes

| Package | Before | After |
| --- | --- | --- |
| `@next/third-parties` | 16.1.7 | 16.4.2 |
| `@prisma/client` | 6.7.0 | 6.19.3 |
| `@radix-ui/react-accordion` | 1.2.0 | 1.3.1 |
| `@radix-ui/react-alert-dialog` | 1.1.1 | 1.2.1 |
| `@radix-ui/react-aspect-ratio` | 1.1.0 | 1.2.0 |
| `@radix-ui/react-avatar` | 1.1.0 | 1.3.1 |
| `@radix-ui/react-checkbox` | 1.1.1 | 1.4.1 |
| `@radix-ui/react-collapsible` | 1.1.0 | 1.2.1 |
| `@radix-ui/react-context-menu` | 2.2.1 | 2.4.1 |
| `@radix-ui/react-dialog` | 1.1.1 | 1.3.1 |
| `@radix-ui/react-dropdown-menu` | 2.1.1 | 2.2.1 |
| `@radix-ui/react-hover-card` | 1.1.1 | 1.2.1 |
| `@radix-ui/react-label` | 2.1.0 | 2.1.17 |
| `@radix-ui/react-menubar` | 1.1.1 | 1.2.1 |
| `@radix-ui/react-navigation-menu` | 1.2.0 | 1.4.1 |
| `@radix-ui/react-popover` | 1.1.1 | 1.3.1 |
| `@radix-ui/react-progress` | 1.1.0 | 1.2.1 |
| `@radix-ui/react-radio-group` | 1.2.0 | 1.5.1 |
| `@radix-ui/react-scroll-area` | 1.1.0 | 1.4.0 |
| `@radix-ui/react-select` | 2.1.1 | 2.4.1 |
| `@radix-ui/react-separator` | 1.1.0 | 1.2.0 |
| `@radix-ui/react-slider` | 1.2.0 | 1.6.1 |
| `@radix-ui/react-slot` | 1.1.0 | 1.5.0 |
| `@radix-ui/react-switch` | 1.1.0 | 1.4.1 |
| `@radix-ui/react-tabs` | 1.1.0 | 1.2.1 |
| `@radix-ui/react-toast` | 1.2.1 | 1.3.1 |
| `@radix-ui/react-toggle` | 1.1.0 | 1.2.1 |
| `@radix-ui/react-toggle-group` | 1.1.0 | 1.2.1 |
| `@radix-ui/react-tooltip` | 1.1.2 | 1.4.1 |
| `@types/node` | 20.6.2 | 24.19.2 |
| `@types/react` | 18.2.22 | 19.3.0 |
| `@types/react-dom` | 18.2.7 | 19.3.0 |
| `@typescript-eslint/eslint-plugin` | 8.0.0 | 8.72.0 |
| `@typescript-eslint/parser` | 8.0.0 | 8.72.0 |
| `cmdk` | 1.0.0 | 1.1.1 |
| `embla-carousel-react` | 8.3.0 | 8.6.0 |
| `eslint` | 9.39.4 | 10.13.0 |
| `eslint-plugin-react-hooks` | 5.2.0 | 7.1.1 |
| `framer-motion` | 10.18.0 | 14.6.0 |
| `input-otp` | 1.2.4 | 1.5.0 |
| `next` | 14.2.35 | 16.4.2 |
| `next-themes` | 0.3.0 | 0.4.6 |
| `nodemailer` | 8.0.7 | 10.2.1 |
| `postcss` | 8.5.10 | 8.5.31 |
| `prisma` | 6.7.0 | 6.19.3 |
| `puppeteer-core` | 24.42.0 | 24.43.1 |
| `react` | 18.2.0 | 19.3.1 |
| `react-day-picker` | 8.10.1 | 10.0.2 |
| `react-dom` | 18.2.0 | 19.3.1 |
| `react-intersection-observer` | 9.8.0 | 11.0.1 |
| `react-resizable-panels` | 2.1.3 | 4.14.8 |
| `sonner` | 1.5.0 | 2.0.8 |
| `typescript` | 5.2.2 | 6.0.3 |
| `vaul` | 0.9.9 | 1.1.2 |
| `zod` | 3.23.8 | 3.25.76 |

## Removed direct declarations

34 unused or redundant direct packages were removed. Nodemailer now supplies
its own types; the lint config directly imports the explicitly declared Next
plugin instead of the unused full config package. Other removals had no executable
imports. Transitive copies may still exist where another package requires them.

- `@azure/storage-blob`
- `@floating-ui/react`
- `@headlessui/react`
- `@hookform/resolvers`
- `@next-auth/prisma-adapter`
- `@next/swc-wasm-nodejs`
- `@tanstack/react-query`
- `@types/jsonwebtoken`
- `@types/nodemailer`
- `@types/plotly.js`
- `@types/react-plotly.js`
- `chart.js`
- `cookie`
- `csv`
- `dayjs`
- `eslint-config-next`
- `eslint-plugin-prettier`
- `formik`
- `jotai`
- `jsonwebtoken`
- `lodash`
- `mapbox-gl`
- `next-auth`
- `plotly.js`
- `react-chartjs-2`
- `react-datepicker`
- `react-is`
- `react-plotly.js`
- `react-select`
- `react-use`
- `swr`
- `tailwind-scrollbar-hide`
- `yup`
- `zustand`

Added explicitly: `@next/eslint-plugin-next` 16.4.2.
