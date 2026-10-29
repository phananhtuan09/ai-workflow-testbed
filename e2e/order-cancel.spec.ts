import { expect, login, test, users } from './fixtures';

test('the owner cancels a draft order from its detail page', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'Monitor arm' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Cancel order' }).click();

  await expect(page.locator('.badge')).toHaveText('Cancelled');
  await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
});

test('another user cannot cancel the order', async ({ page }) => {
  await login(page, users.bob);
  const response = await page.request.post('/api/orders/2/cancel');
  expect(response.status()).toBe(404);
});

test('a confirmed order shows no cancel button', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'Standing desk' }).click();
  await expect(page.getByRole('heading', { name: 'Standing desk' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
});
