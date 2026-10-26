import { expect, request as playwrightRequest, test } from '@playwright/test';
import type { OrderWithOwner } from '../../shared/types';
import { login, users } from '../fixtures';
import { apiLogin, attachObservations, readOrders, requestRecord, resetData, type Observations } from './helpers';

test.use({ trace: 'on' });

test.beforeEach(async ({ request }) => {
  expect(await resetData(request)).toBe(204);
});

test('[E2E-01] a user sees only their own orders', async ({ page }) => {
  await login(page, users.alice);
  const rendered = await page.locator('tbody tr td:first-child a').allInnerTexts();
  const apiResponse = await page.request.get('/api/orders');
  const apiOrders = (await apiResponse.json()) as OrderWithOwner[];

  await attachObservations({
    actualPath: 'Login as alice -> /orders list; GET /api/orders in the same session',
    checks: [
      { id: 'rendered_names', source: 'rendered DOM on /orders', expected: ['Monitor arm', 'Standing desk'], actual: rendered },
      {
        id: 'api_owner_ids',
        source: 'GET /api/orders',
        expected: [2, 2],
        actual: apiOrders.map((order) => order.ownerId),
      },
      { id: 'owner_column_hidden', source: 'rendered DOM on /orders', expected: 0, actual: await page.getByRole('columnheader', { name: 'Owner' }).count() },
    ],
    request: requestRecord('GET', '/api/orders', apiResponse),
    cleanup: 'NOT_REQUIRED',
  });
});

test('[E2E-02] a user creates an order and it persists after reload', async ({ page, request }) => {
  let observations: Observations | undefined;
  try {
    await login(page, users.alice);
    const before = await readOrders(page.request);

    await page.getByRole('link', { name: 'New order' }).click();
    await page.getByLabel('Name').fill('Desk lamp');
    await page.getByLabel('Price').fill('25.50');
    const createResponse = page.waitForResponse((response) => response.url().endsWith('/api/orders') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save' }).click();
    const created = await createResponse;
    const createdOrder = (await created.json()) as OrderWithOwner;
    await expect(page.getByRole('heading', { name: 'Desk lamp' })).toBeVisible();

    await page.reload();
    const renderedTotal = await page.getByTestId('order-total').innerText();
    const fresh = await page.request.get(`/api/orders/${createdOrder.id}`);
    const persisted = (await fresh.json()) as OrderWithOwner;
    const after = await readOrders(page.request);

    observations = {
      actualPath: `Login as alice -> New order -> fill form -> Save; POST /api/orders ${created.status()}; reload /orders/${createdOrder.id}; GET /api/orders/${createdOrder.id}`,
      checks: [
        { id: 'create_status', source: 'POST /api/orders response', expected: 201, actual: created.status() },
        { id: 'rendered_total_after_reload', source: `rendered DOM on /orders/${createdOrder.id} after reload`, expected: '$25.50', actual: renderedTotal },
        {
          id: 'persisted_order',
          source: `GET /api/orders/${createdOrder.id}`,
          expected: { name: 'Desk lamp', priceCents: 2550, discountPercent: 0, ownerId: 2, status: 'draft' },
          actual: {
            name: persisted.name,
            priceCents: persisted.priceCents,
            discountPercent: persisted.discountPercent,
            ownerId: persisted.ownerId,
            status: persisted.status,
          },
        },
        { id: 'order_count_delta', source: 'GET /api/orders before and after', expected: 1, actual: after.length - before.length },
      ],
      baseline: { orderCount: before.length },
      cleanup: 'INCOMPLETE',
    };
  } finally {
    const status = await resetData(request);
    if (observations) observations.cleanup = status === 204 ? 'COMPLETE' : 'INCOMPLETE';
  }
  await attachObservations(observations!);
});

test('[E2E-03] a non-admin cannot apply a discount through the API', async ({ baseURL }) => {
  const alice = await playwrightRequest.newContext({ baseURL });
  let observations: Observations | undefined;
  try {
    await apiLogin(alice, users.alice);
    const before = await readOrders(alice);
    const response = await alice.post('/api/orders', {
      data: { name: 'Discounted chair', priceCents: 10_000, discountPercent: 10 },
    });
    const body = (await response.json()) as { error: string };
    const after = await readOrders(alice);

    observations = {
      actualPath: 'API as alice: POST /api/orders with discountPercent 10; GET /api/orders before and after',
      checks: [
        { id: 'status', source: 'POST /api/orders response', expected: 403, actual: response.status() },
        { id: 'error', source: 'POST /api/orders response body', expected: 'errors.discountAdminOnly', actual: body.error },
        { id: 'order_count_unchanged', source: 'GET /api/orders before and after', expected: before.length, actual: after.length },
      ],
      request: requestRecord('POST', '/api/orders', response),
      cleanup: 'INCOMPLETE',
    };
  } finally {
    const status = await resetData(alice);
    if (observations) observations.cleanup = status === 204 ? 'COMPLETE' : 'INCOMPLETE';
    await alice.dispose();
  }
  await attachObservations(observations!);
});

test("[E2E-04] a user cannot read or edit another user's order", async ({ baseURL }) => {
  const bob = await playwrightRequest.newContext({ baseURL });
  const admin = await playwrightRequest.newContext({ baseURL });
  let observations: Observations | undefined;
  try {
    await apiLogin(bob, users.bob);
    await apiLogin(admin, users.admin);
    const baselineResponse = await admin.get('/api/orders/2');
    const baseline = (await baselineResponse.json()) as OrderWithOwner;

    const read = await bob.get('/api/orders/1');
    const edit = await bob.put('/api/orders/2', { data: { name: 'Taken over', priceCents: 1, discountPercent: 0 } });
    const after = (await (await admin.get('/api/orders/2')).json()) as OrderWithOwner;

    observations = {
      actualPath: 'API as bob: GET /api/orders/1, PUT /api/orders/2; API as admin: GET /api/orders/2 before and after',
      checks: [
        { id: 'read_status', source: 'GET /api/orders/1 as bob', expected: 404, actual: read.status() },
        { id: 'edit_status', source: 'PUT /api/orders/2 as bob', expected: 404, actual: edit.status() },
        {
          id: 'order_unchanged',
          source: 'GET /api/orders/2 as admin before and after',
          expected: { name: baseline.name, priceCents: baseline.priceCents },
          actual: { name: after.name, priceCents: after.priceCents },
        },
      ],
      baseline: { orderId: 2, name: baseline.name, priceCents: baseline.priceCents },
      requests: [requestRecord('GET', '/api/orders/1', read), requestRecord('PUT', '/api/orders/2', edit)],
      cleanup: 'INCOMPLETE',
    };
  } finally {
    const status = await resetData(admin);
    if (observations) observations.cleanup = status === 204 ? 'COMPLETE' : 'INCOMPLETE';
    await bob.dispose();
    await admin.dispose();
  }
  await attachObservations(observations!);
});

test('[E2E-05] an admin confirms an order and it can no longer be edited', async ({ page, request }) => {
  let observations: Observations | undefined;
  try {
    await login(page, users.admin);
    await page.goto('/orders/2');
    const confirmResponse = page.waitForResponse((response) => response.url().endsWith('/api/orders/2/confirm'));
    await page.getByRole('button', { name: 'Confirm order' }).click();
    const confirmed = await confirmResponse;
    await expect(page.locator('.badge')).toHaveText('Confirmed');

    await page.reload();
    const badge = await page.locator('.badge').innerText();
    const editLinks = await page.getByRole('link', { name: 'Edit' }).count();
    const persisted = (await (await page.request.get('/api/orders/2')).json()) as OrderWithOwner;
    const edit = await page.request.put('/api/orders/2', { data: { name: 'Changed', priceCents: 100, discountPercent: 0 } });

    observations = {
      actualPath: `Login as admin -> /orders/2 -> Confirm order; POST /api/orders/2/confirm ${confirmed.status()}; reload; GET /api/orders/2; PUT /api/orders/2`,
      checks: [
        { id: 'confirm_status', source: 'POST /api/orders/2/confirm response', expected: 200, actual: confirmed.status() },
        { id: 'rendered_status_after_reload', source: 'rendered DOM on /orders/2 after reload', expected: 'Confirmed', actual: badge },
        { id: 'edit_link_hidden', source: 'rendered DOM on /orders/2 after reload', expected: 0, actual: editLinks },
        { id: 'persisted_status', source: 'GET /api/orders/2', expected: 'confirmed', actual: persisted.status },
        { id: 'edit_rejected', source: 'PUT /api/orders/2 response', expected: 409, actual: edit.status() },
      ],
      cleanup: 'INCOMPLETE',
    };
  } finally {
    const status = await resetData(request);
    if (observations) observations.cleanup = status === 204 ? 'COMPLETE' : 'INCOMPLETE';
  }
  await attachObservations(observations!);
});

test('[E2E-06] the API enforces the 100-character name limit', async ({ baseURL }) => {
  const alice = await playwrightRequest.newContext({ baseURL });
  let observations: Observations | undefined;
  try {
    await apiLogin(alice, users.alice);
    const tooLong = await alice.post('/api/orders', { data: { name: 'a'.repeat(101), priceCents: 100, discountPercent: 0 } });
    const tooLongBody = (await tooLong.json()) as { fields?: { name?: string } };
    const atLimit = await alice.post('/api/orders', { data: { name: 'b'.repeat(100), priceCents: 100, discountPercent: 0 } });
    const created = (await atLimit.json()) as OrderWithOwner;
    const persisted = (await (await alice.get(`/api/orders/${created.id}`)).json()) as OrderWithOwner;

    observations = {
      actualPath: `API as alice: POST /api/orders with 101 and 100 character names; GET /api/orders/${created.id}`,
      checks: [
        { id: 'too_long_status', source: 'POST /api/orders (101 chars) response', expected: 400, actual: tooLong.status() },
        { id: 'too_long_error', source: 'POST /api/orders (101 chars) response body', expected: 'validation.nameTooLong', actual: tooLongBody.fields?.name },
        { id: 'at_limit_status', source: 'POST /api/orders (100 chars) response', expected: 201, actual: atLimit.status() },
        { id: 'at_limit_persisted_length', source: `GET /api/orders/${created.id}`, expected: 100, actual: persisted.name.length },
      ],
      requests: [requestRecord('POST', '/api/orders', tooLong), requestRecord('POST', '/api/orders', atLimit)],
      cleanup: 'INCOMPLETE',
    };
  } finally {
    const status = await resetData(alice);
    if (observations) observations.cleanup = status === 204 ? 'COMPLETE' : 'INCOMPLETE';
    await alice.dispose();
  }
  await attachObservations(observations!);
});
