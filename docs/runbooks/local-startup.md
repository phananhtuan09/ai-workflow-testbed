# Start the Order Desk stack locally

Status: Verified
Applies to: Order Desk (`main`), local development and e2e runs, Node 22
Last verified: 2026-11-06

## Outcome

The API (Express) and web app (Vite) run on the local machine and `GET http://localhost:5173/api/health` answers successfully.

## Preconditions

- Dependencies are installed (`npm install`, or `npm ci` for a clean tree).
- Ports 5173 (web) and 3001 (API) are free.
- No secrets are needed; accounts are seeded test accounts.

## Safety

- `TEST_MODE=1` enables `POST /api/test/reset`; use it only locally.
- Do not run `npm run db:reset` unless you intend to wipe the database in `DATA_DIR`.

## Procedure

1. Start both services with the e2e settings:

   ```bash
   WEB_PORT=5173 API_PORT=3001 DATA_DIR=.data/e2e TEST_MODE=1 FIXED_NOW=2026-02-01T08:00:00.000Z npm run dev
   ```

## Verification

1. In another shell, run:

   ```bash
   curl -fsS http://localhost:5173/api/health
   ```

   Expected: a successful response (`{"ok":true}`).

## Recovery

1. Stop the process (Ctrl+C stops both services).
2. If the data is corrupt, delete `.data/e2e/` and start again.

## References

- `.claude/skills/runtime-e2e-test/references/project-runtime.md`
