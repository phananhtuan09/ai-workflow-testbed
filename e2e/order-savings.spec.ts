import { expect, login, test, users } from './fixtures';

test('a discounted order shows the discounted total', async ({ page }) => {
  await login(page, users.alice);
  await page.goto('/orders/2');
  await expect(page.getByRole('heading', { name: 'Monitor arm' })).toBeVisible();
  await expect(page.getByTestId('order-total')).toHaveText('$80.10');
});
