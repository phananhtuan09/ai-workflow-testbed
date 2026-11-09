import { expect, login, test, users } from './fixtures';

test('a user sees only their own orders', async ({ page }) => {
  await login(page, users.alice);
  await expect(page.getByRole('link', { name: 'Standing desk' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Monitor arm' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Office chair' })).toHaveCount(0);
});

test('an admin sees every order with its owner', async ({ page }) => {
  await login(page, users.admin);
  const row = page.getByRole('row', { name: /Office chair/ });
  await expect(row).toContainText('Ada Admin');
  await expect(page.getByRole('row')).toHaveCount(4);
});

test('a user creates an order and it persists after reload', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'New order' }).click();
  await page.getByLabel('Name').fill('Desk lamp');
  await page.getByLabel('Product').fill('Desk lamp');
  await page.getByLabel('Unit price').fill('25.50');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('heading', { name: 'Desk lamp' })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('order-total')).toHaveText('$25.50');
});

test('a user cannot open another user\'s order by ID', async ({ page }) => {
  await login(page, users.bob);
  await page.goto('/orders/1');
  await expect(page.getByRole('alert')).toHaveText(/Not found/);
});
