import { expect, login, test, users } from './fixtures';

test('the orders list shows how many orders the user can see', async ({ page }) => {
  await login(page, users.alice);
  await expect(page.getByText('2 orders')).toBeVisible();
});

test('the order count includes every order for an admin', async ({ page }) => {
  await login(page, users.admin);
  await expect(page.getByText('3 orders')).toBeVisible();
});

test('the order count uses the singular for one order', async ({ page }) => {
  await login(page, users.bob);
  await page.getByRole('link', { name: 'New order' }).click();
  await page.getByLabel('Name').fill('Keyboard');
  await page.getByLabel('Price').fill('49.00');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Keyboard' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to orders' }).click();
  await expect(page.getByText('1 order', { exact: true })).toBeVisible();
});
