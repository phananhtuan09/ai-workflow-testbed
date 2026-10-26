# Runtime E2E Test Plan: Order Desk baseline

- Status: COMPLETED
- Run ID: 764a054a-9b2f-4b83-a187-a996e251ef3d
- Environment: isolated local (Playwright-started `npm run dev`, `DATA_DIR=.data/e2e`, `TEST_MODE=1`, `FIXED_NOW=2026-02-01T08:00:00.000Z`), Chromium `desktop` project
- Tested revisions: ai-workflow-testbed@62d7e31 plus uncommitted workflow install and `e2e/runtime/` (identity in approved file hashes); ai-agent-workflow@3e4e8c9; Node v22.22.0; Playwright 1.63.0
- Last updated: 2026-10-26T09:56:00Z

## Scope

Baseline acceptance of the existing Order Desk behavior on `main`, documented in `README.md` (Features):
order visibility per role, order creation with persistence, discount permission, cross-user access, order confirmation lock, and the name length limit.
This is the first run of the installed `runtime-e2e-test` skill on this project and serves as its baseline for later workflow changes.

Out of scope: the `mobile` project, language switching, the delete flow, visual layout, and subjective UX.
Supporting proof already available: `npm test` (unit rules in `shared/order-rules.ts`) and `e2e/smoke.spec.ts`; neither counts toward these cases.

Suite: `docs/testing/completed/order-desk-baseline.suite.json`; tests: `e2e/runtime/order-desk-baseline.spec.ts`.

## Run summary

- Total: 6
- PASS: 6
- FAIL: 0
- BLOCKED: 0
- NOT_RUN: 0
- INVALIDATED: 0
- Release-blocking PASS: 4/4

## Human sign-off

- Decision: PENDING
- Reviewer: —
- Date: —
- Notes: No case needs human judgment. Approval of the plan and tests was given by phananhtuan09 before the run (`approval.json` in the bundle). Generated summary: `.runtime-e2e/order-desk-baseline/20261026T095417Z/summary.md` (evidence bundles are local only and gitignored).

## Case E2E-01 — A user sees only their own orders

- Priority: RELEASE_BLOCKING
- Human judgment: NO

### Runtime path

`/login` as `alice` → `/orders` list in the browser; `GET /api/orders` in the same session.

### Expected

The list shows exactly Alice's orders, newest first ("Monitor arm", "Standing desk"); the API returns only orders owned by user 2; the Owner column is not shown to a non-admin.

### Execution

- Result: PASS
- Actual path: Login as alice -> /orders list; GET /api/orders in the same session
- Path match: YES
- Observed: rendered_names=["Monitor arm", "Standing desk"]; api_owner_ids=[2, 2]; owner_column_hidden=0
- Evidence: `.runtime-e2e/order-desk-baseline/20261026T095417Z/results.json` (case E2E-01, 1 attempt); native results `native.json`; trace in `artifacts/`
- Cleanup: NOT_REQUIRED

## Case E2E-02 — A user creates an order and it persists after reload

- Priority: RELEASE_BLOCKING
- Human judgment: NO

### Runtime path

`/login` as `alice` → Orders → New order → fill Name "Desk lamp", Price "25.50" → Save; observe `POST /api/orders`; reload the order detail page; fresh `GET /api/orders/{id}`.

### Expected

Create returns 201; after reload the detail shows total "$25.50"; the persisted order has name "Desk lamp", 2550 cents, 0% discount, owner 2, status draft; the order count grows by exactly one from the captured baseline.

### Execution

- Result: PASS
- Actual path: Login as alice -> New order -> fill form -> Save; POST /api/orders 201; reload /orders/4; GET /api/orders/4
- Path match: YES
- Observed: create_status=201; rendered_total_after_reload="$25.50"; persisted_order={"name": "Desk lamp", "priceCents": 2550, "discountPercent": 0, "ownerId": 2, "status": "draft"}; order_count_delta=1
- Evidence: `.runtime-e2e/order-desk-baseline/20261026T095417Z/results.json` (case E2E-02, 1 attempt); native results `native.json`; trace in `artifacts/`
- Cleanup: COMPLETE

## Case E2E-03 — A non-admin cannot apply a discount through the API

- Priority: RELEASE_BLOCKING
- Human judgment: NO

### Runtime path

Authenticated API session as `alice` → `POST /api/orders` with `discountPercent: 10`; `GET /api/orders` before and after.

### Expected

The API responds 403 with `errors.discountAdminOnly`, and the number of Alice's orders is unchanged.

### Execution

- Result: PASS
- Actual path: API as alice: POST /api/orders with discountPercent 10; GET /api/orders before and after
- Path match: YES
- Observed: status=403; error="errors.discountAdminOnly"; order_count_unchanged=2
- Evidence: `.runtime-e2e/order-desk-baseline/20261026T095417Z/results.json` (case E2E-03, 1 attempt); native results `native.json`; request statuses in runtime-observations
- Cleanup: COMPLETE

## Case E2E-04 — A user cannot read or edit another user's order

- Priority: RELEASE_BLOCKING
- Human judgment: NO

### Runtime path

Authenticated API session as `bob` → `GET /api/orders/1` and `PUT /api/orders/2` (both owned by Alice); admin session reads `GET /api/orders/2` before and after.

### Expected

Both requests respond 404, and order 2's name and price are unchanged from the captured baseline.

### Execution

- Result: PASS
- Actual path: API as bob: GET /api/orders/1, PUT /api/orders/2; API as admin: GET /api/orders/2 before and after
- Path match: YES
- Observed: read_status=404; edit_status=404; order_unchanged={"name": "Monitor arm", "priceCents": 8900}
- Evidence: `.runtime-e2e/order-desk-baseline/20261026T095417Z/results.json` (case E2E-04, 1 attempt); native results `native.json`; request statuses in runtime-observations
- Cleanup: COMPLETE

## Case E2E-05 — An admin confirms an order and it can no longer be edited

- Priority: NORMAL
- Human judgment: NO

### Runtime path

`/login` as `admin` → `/orders/2` → Confirm order; observe `POST /api/orders/2/confirm`; reload; fresh `GET /api/orders/2`; `PUT /api/orders/2`.

### Expected

Confirm returns 200; after reload the badge shows "Confirmed" and no Edit link is shown; the persisted status is `confirmed`; an edit attempt responds 409.

### Execution

- Result: PASS
- Actual path: Login as admin -> /orders/2 -> Confirm order; POST /api/orders/2/confirm 200; reload; GET /api/orders/2; PUT /api/orders/2
- Path match: YES
- Observed: confirm_status=200; rendered_status_after_reload="Confirmed"; edit_link_hidden=0; persisted_status="confirmed"; edit_rejected=409
- Evidence: `.runtime-e2e/order-desk-baseline/20261026T095417Z/results.json` (case E2E-05, 1 attempt); native results `native.json`; trace in `artifacts/`
- Cleanup: COMPLETE

## Case E2E-06 — The API enforces the 100-character name limit

- Priority: NORMAL
- Human judgment: NO

### Runtime path

Authenticated API session as `alice` → `POST /api/orders` with a 101-character name, then with a 100-character name; fresh `GET /api/orders/{id}` for the created order.

### Expected

The 101-character name responds 400 with `validation.nameTooLong` on the name field; the 100-character name responds 201 and persists all 100 characters.

### Execution

- Result: PASS
- Actual path: API as alice: POST /api/orders with 101 and 100 character names; GET /api/orders/4
- Path match: YES
- Observed: too_long_status=400; too_long_error="validation.nameTooLong"; at_limit_status=201; at_limit_persisted_length=100
- Evidence: `.runtime-e2e/order-desk-baseline/20261026T095417Z/results.json` (case E2E-06, 1 attempt); native results `native.json`; request statuses in runtime-observations
- Cleanup: COMPLETE
