import { expect, login, test, users } from './fixtures';

test('the orders list shows how long ago each order was created', async ({ page }) => {
  await login(page, users.alice);
  const row = page.getByRole('row', { name: /Standing desk/ });
  await expect(row.getByRole('cell').last()).toHaveText(/days ago/);
  await expect(row.getByRole('cell').last()).toHaveAttribute('title', 'Jan 5, 2026');
});
