import { expect, login, test, users } from './fixtures';

test('the orders list shows the created day relative to today', async ({ page }) => {
  await page.clock.setFixedTime('2026-02-01T20:00:00.000Z');
  await login(page, users.alice);
  const standingDesk = page.getByRole('row', { name: /Standing desk/ }).getByRole('cell').last();
  const monitorArm = page.getByRole('row', { name: /Monitor arm/ }).getByRole('cell').last();
  await expect(standingDesk).toHaveText('27 days ago');
  await expect(standingDesk).toHaveAttribute('title', 'Jan 5, 2026');
  await expect(monitorArm).toHaveText('26 days ago');
});
