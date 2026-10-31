# Order Desk

A small order-management app: React + Vite on the front end, an Express API, and a JSON file database.
This repository is used to try [ai-agent-workflow](https://github.com/phananhtuan09/ai-agent-workflow) skills on realistic pull requests.

## Features

- Sign in with one of three seeded accounts; sessions use an HTTP-only cookie.
- Orders list with loading, empty, and error states.
  Users see only their own orders; admins see every order and its owner.
- Create and edit orders with a name (max 100 characters), a price, and a discount (0–50%, admins only).
- Order detail with total price; admins can confirm or delete an order.
  Confirmed orders can no longer be edited.
- Order notes: the owner and admins add notes (max 500 characters, `**bold**` and line breaks) on the detail page, which refreshes them every 10 seconds; the list shows how many notes each order has.
  Authors and admins can delete a note.
- Signing in returns to the page that was opened (`/login?next=...`).
- English and Vietnamese UI; every UI string goes through `src/i18n/`.

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | admin |
| `alice` | `alice123` | user |
| `bob` | `bob123` | user |

## Running

Requires Node 22+.

```bash
npm install
npm run dev          # API on :3001, web on :5173 (proxies /api)
```

Open http://localhost:5173.
Production mode serves the built front end from the API process:

```bash
npm run build
npm start            # http://localhost:3001
```

## Checks

| Command | What it runs |
| --- | --- |
| `npm run lint` | ESLint (TypeScript + React hooks rules) |
| `npm run typecheck` | `tsc -b` for app and server |
| `npm run build` | Type check + Vite production build |
| `npm test` | Vitest unit tests (`shared/`, `src/lib/`) |
| `npm run test:e2e` | Playwright tests in `e2e/` on desktop and mobile viewports; starts the dev servers itself |

Install the Playwright browser once with `npx playwright install chromium` if it is not already available.

## Runtime facts

| Item | Value |
| --- | --- |
| Start (dev) | `npm run dev` |
| Readiness | `GET /api/health` returns `{"ok":true}` |
| Ports | `API_PORT` (default 3001), `WEB_PORT` (default 5173) |
| Data | `DATA_DIR/db.json` (default `.data/`), created from `server/seed.ts` on first start |
| Reset data | `npm run db:reset`, or `POST /api/test/reset` when `TEST_MODE=1` |
| Frozen clock | `FIXED_NOW=<ISO timestamp>` fixes the server time for new orders |
| Seed identity | Fixed user IDs 1–3, order IDs 1–3, note IDs 1–3, fixed timestamps |

To run two copies side by side (for example two revisions in separate worktrees), give each its own ports and data directory:

```bash
API_PORT=3101 WEB_PORT=5273 DATA_DIR=.data/base TEST_MODE=1 npm run dev
API_PORT=3201 WEB_PORT=5373 DATA_DIR=.data/head TEST_MODE=1 npm run dev
```

`TEST_MODE` and `FIXED_NOW` are for local and CI runs only.

## Project layout

```
server/            Express API: auth, orders, JSON database, seed data
shared/            Types and order rules used by both server and client
src/components/    Shared UI: Button, TextField, StateView, Layout
src/pages/         Login, orders list, order detail, order form
src/lib/           API client, useResource data hook, auth context, formatting
src/i18n/          English and Vietnamese messages
src/styles/        Global CSS and design tokens (CSS variables)
e2e/               Playwright tests and fixtures
```

## Conventions

- Load server data in components with `useResource` (`src/lib/useResource.ts`) and the `api` client (`src/lib/api.ts`).
- Order rules live in `shared/order-rules.ts` and are enforced on both client and server.
  The server is the authority for permissions.
- Colors and spacing come from the CSS variables in `src/styles/global.css`.
- Format money and dates with `src/lib/format.ts`.
