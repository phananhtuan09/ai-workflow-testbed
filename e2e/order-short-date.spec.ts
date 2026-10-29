import { expect, login, test, users } from './fixtures';

test('the orders list shows a short created date with the full date on hover', async ({ page }) => {
  await login(page, users.alice);
  const cell = page.getByRole('row', { name: /Standing desk/ }).getByRole('cell').last();
  await expect(cell).toHaveText('Jan 5');
  await expect(cell).toHaveAttribute('title', 'Jan 5, 2026');
});
