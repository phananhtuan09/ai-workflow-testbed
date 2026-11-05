import { expect, login, test, users } from './fixtures';

test('an admin confirming an order without an accounting webhook sees it was not sent', async ({ page }) => {
  await login(page, users.admin);
  await page.getByRole('link', { name: 'Office chair' }).click();
  await page.getByRole('button', { name: 'Confirm order' }).click();

  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Not sent to accounting');
  await expect(page.getByRole('button', { name: 'Resend' })).toBeVisible();
});

test('the order owner does not see the accounting state', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'Standing desk' }).click();
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
  await expect(page.getByText('accounting')).toHaveCount(0);
});
