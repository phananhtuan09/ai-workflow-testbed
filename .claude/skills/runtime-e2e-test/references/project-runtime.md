# Project Runtime E2E Reference

This file is a project-local operational reference. Complete it after installing the
skill, keep commands and paths current, and never store secret values here.

- Status: READY
- Maintainer: phananhtuan09
- Last verified: 2026-10-26
- Applies to: Order Desk (`main`), Node 22, Playwright 1.63.0

Use `Status: READY` only after the preflight commands and environment assumptions
below have been verified in this project.

## Runtime topology

Playwright's `webServer` (in `playwright.config.ts`) starts both services through `npm run dev` and stops them when the run ends.

| Service | Working directory | Start command | Ready signal | Stop/reset command | Log location |
| --- | --- | --- | --- | --- | --- |
| web (Vite) | `.` | `npm run dev:web` (via `npm run dev`) | `http://localhost:$WEB_PORT/` | Stopped by Playwright; reset not needed | Playwright `webServer` output in `stdout.log` of the run bundle |
| api (Express) | `.` | `npm run dev:api` (via `npm run dev`) | `GET http://localhost:$WEB_PORT/api/health` returns `{"ok":true}` | `POST /api/test/reset` (only with `TEST_MODE=1`) or `npm run db:reset` | Same as web |

## Environment

- Runtime profile: isolated local; JSON file database under `DATA_DIR`.
- Environment file or setup command: `.env.example` documents variables; `playwright.config.ts` sets them for e2e runs.
- Required variable names: `API_PORT`, `WEB_PORT`, `DATA_DIR`, `TEST_MODE`, `FIXED_NOW`.
- Secret acquisition method: none required; fixture accounts are seeded test accounts.
- Allowed external dependencies: none.
- Prohibited targets: any host other than `localhost`.
- Configuration identity to record in plans: git commit of this repository, Node version, Playwright version, `FIXED_NOW` value.

## Existing E2E entrypoints

- Full-suite command: `npx --no-install playwright test`
- Focused-case command/filter: `npx --no-install playwright test <file> --project=desktop`
- Browser harness: `playwright.config.ts`, `@playwright/test` 1.63.0, projects `desktop` (Desktop Chrome) and `mobile` (Pixel 7).
- Runtime artifacts produced by the harness: `test-results/`, `playwright-report/` (both gitignored).

Existing automated E2E commands may execute cases, but the plan ledger remains the
source for declared paths, observed outcomes, and evidence.

## UI and authentication

- Application URL: `http://localhost:5173` (or `WEB_PORT`).
- Supported browser/device and viewport: Chromium; `desktop` (1280×720) and `mobile` (Pixel 7).
- Authentication setup: log in through `/login` with a seeded account; the API sets an HTTP-only `sid` cookie. Helper: `login()` in `e2e/fixtures.ts`.
- Roles/accounts available: `admin` (admin, user ID 1), `alice` (user, ID 2), `bob` (user, ID 3); passwords are in `e2e/fixtures.ts` and `server/seed.ts`.
- Important user entrypoints: `/login`, `/orders`, `/orders/new`, `/orders/:id`, `/orders/:id/edit`.

## API and state observation

- API base URL: `http://localhost:5173/api` (proxied by Vite to `API_PORT`).
- Health/readiness endpoint: `GET /api/health`.
- Request observation method: browser network events or Playwright `APIRequestContext` responses (method, route, status).
- Correlation/trace lookup: not available; use Playwright trace and run ID.
- Persisted-state observation: fresh `GET /api/orders/:id` or `GET /api/orders` in an authenticated context, or a UI reload. The server writes every change to `DATA_DIR/db.json` before responding.
- Forbidden shortcuts: editing `DATA_DIR/db.json` directly; calling `/api/test/reset` to create or change test data (reset is for setup and cleanup only).

## Fixtures and cleanup

- Seed/setup command: `POST /api/test/reset` before each case restores `server/seed.ts` data.
- Fixture namespace or identifier convention: seeded IDs (users 1–3, orders 1–3); new orders get IDs from 4 upward after a reset.
- Required baseline data: the seed in `server/seed.ts`.
- Cleanup command or procedure: `POST /api/test/reset` after each mutating case; report `COMPLETE` only when it returns 204.
- Isolation/concurrency constraints: one database per `DATA_DIR`; run mutation cases serially (`workers: 1`).
- Recovery procedure after interruption: `DATA_DIR=.data/e2e npm run db:reset`, or delete `.data/e2e/`.

## Evidence conventions

- Artifact root: `.runtime-e2e/<plan-slug>/<UTC timestamp>/` (gitignored; local only).
- Screenshot/recording naming: Playwright defaults inside the bundle's `artifacts/`.
- Runtime log references: `stdout.log` / `stderr.log` in the bundle.
- Request evidence: method, route, and status recorded in each case's `runtime-observations`.
- Retention or redaction rules: fixture data only, no secrets; keep bundles locally, do not upload.

## Safety constraints

- Mutations only against the local `DATA_DIR` started by this run.
- No external side effects exist.
- Reset the database after every mutating case.
- Never point `baseURL` or the API at a non-localhost host; stop and ask a human if a config does.

## Preflight

Before setting `Status: READY`, verify:

- every required service can start and exposes the documented ready signal;
- the selected environment is permitted and distinguishable from production;
- required variable names are documented and their values are available securely;
- authentication and fixture setup work;
- evidence can be captured at the documented locations;
- cleanup restores the environment to its baseline;
- commands use repository-relative paths where practical.

Verified on 2026-10-26: `npm install`, `npm run build`, and `CI=1 npx playwright test` (8/8 passed) on commit `62d7e31`.
Before a run, make sure ports 5173 and 3001 are free and run with `CI=1` so Playwright starts its own servers instead of reusing a developer server.

## Known limitations

- No CI pipeline yet; runs are local only.
- No request correlation IDs.

## Playwright execution and audit

- Project root: repository root.
- Test/config/helper locations: `e2e/` (shared fixtures in `e2e/fixtures.ts`); runtime plan specs in `e2e/runtime/`.
- Dependency/browser installation: in Claude Code cloud sessions the SessionStart hook (`.claude/hooks/session-start.sh`) runs `npm install` before the session starts, and Chromium for Playwright is preinstalled (`PLAYWRIGHT_BROWSERS_PATH`). Elsewhere, `npm ci` and `npx playwright install chromium` need human approval; never install implicitly.
- Native execution command: `["npx", "--no-install", "playwright", "test", "<spec>", "--project=desktop"]`
- Evidence attachment policy: traces on for browser cases (`test.use({ trace: 'on' })` in the spec); fixture data only.
- Persistence proof: fresh `GET /api/orders/:id` after a page reload.

Use the skill's suite contract and evidence tool described in `playwright-contract.md`.
Launch a separate browser per invocation rather than attaching to a shared CDP session.
Tests must emit structured checkpoint observations, not screenshot-only proof.

## Base instance

Used when a suite declares `base` to prove that new-behavior tests can fail.

- Base environment: `WEB_PORT=5273`, `API_PORT=3101`, `DATA_DIR=.data/e2e-base` (the head run keeps 5173/3001 and `.data/e2e`).
- Base setup: `["npm", "ci", "--prefer-offline", "--no-audit", "--no-fund"]` in the base worktree.
- Base start limitations: NONE; Playwright's `webServer` starts the base app from the worktree with the base environment.

## Parallel execution

- Isolation: serialized; one worker, one `DATA_DIR`.
- Run marker: not used in data; the run ID is recorded in the bundle.
- Shared mutation lock: NOT_REQUIRED; each run owns its `DATA_DIR` and its servers.
- Ports/service ownership: Playwright owns ports 5173/3001 for the run and shuts the servers down.
- Interrupted-run recovery: reset `.data/e2e` as above.

Unknown isolation means serialize mutation runs.
Browser contexts do not isolate database state or external side effects.
Never reset a shared database or stop services owned by another run.
