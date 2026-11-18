import { expect, login, test, users } from './fixtures';

test('an owner archives a draft order and undoes it', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('button', { name: 'Actions for Monitor arm' }).click();
  await page.getByRole('menuitem', { name: 'Archive' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Archive order' }).click();

  const toast = page.getByRole('status').filter({ hasText: 'Monitor arm archived' });
  await expect(toast).toBeVisible();
  await expect(page.getByRole('link', { name: 'Monitor arm' })).toHaveCount(0);

  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('link', { name: 'Monitor arm' })).toBeVisible();
});

test('a confirmed order has no archive action and the API refuses it', async ({ page, request }) => {
  await login(page, users.alice);
  await expect(page.getByRole('button', { name: 'Actions for Standing desk' })).toHaveCount(0);
  await request.post('/api/auth/login', { data: { username: 'alice', password: 'alice123' } });
  const response = await request.post('/api/orders/1/archive');
  expect(response.status()).toBe(409);
});

test('archived orders are listed under the Archived view and can be restored', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('button', { name: 'Actions for Monitor arm' }).click();
  await page.getByRole('menuitem', { name: 'Archive' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Archive order' }).click();
  await expect(page.getByRole('link', { name: 'Monitor arm' })).toHaveCount(0);

  await page.getByLabel('Show').selectOption('archived');
  await expect(page.getByRole('link', { name: 'Monitor arm' })).toBeVisible();
  await page.getByRole('button', { name: 'Actions for Monitor arm' }).click();
  await page.getByRole('menuitem', { name: 'Restore' }).click();
  await expect(page.getByRole('link', { name: 'Monitor arm' })).toHaveCount(0);

  await page.getByLabel('Show').selectOption('active');
  await expect(page.getByRole('link', { name: 'Monitor arm' })).toBeVisible();
});
