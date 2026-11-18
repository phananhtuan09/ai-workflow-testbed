import { expect, login, test, users } from './fixtures';

test('a user creates an order with several lines and sees the total', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'New order' }).click();
  await page.getByLabel('Name').fill('Home office');
  await page.getByLabel('Product').fill('Desk lamp');
  await page.getByLabel('Quantity').fill('2');
  await page.getByLabel('Unit price').fill('12.50');
  await page.getByRole('button', { name: 'Add line' }).click();
  await page.getByLabel('Product').nth(1).fill('USB hub');
  await page.getByLabel('Unit price').nth(1).fill('19.99');
  await expect(page.getByTestId('items-subtotal')).toHaveText('Subtotal: $44.99');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('heading', { name: 'Home office' })).toBeVisible();
  await expect(page.getByTestId('order-items').getByRole('row')).toHaveCount(3);
  await page.reload();
  await expect(page.getByTestId('order-total')).toHaveText('$44.99');
});

test('the owner changes a quantity from the detail page', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'Monitor arm' }).click();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(page.getByTestId('item-quantity')).toHaveText('2');
  await expect(page.getByTestId('order-total')).toHaveText('$160.20');
});

test('lines of a confirmed order cannot be changed', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'Standing desk' }).click();
  await expect(page.getByTestId('order-items').getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Increase quantity' })).toHaveCount(0);
  const patch = await page.request.patch('/api/orders/1/items/1', { data: { quantity: 3 } });
  expect(patch.status()).toBe(409);
});

test('the list shows how many lines each order has', async ({ page }) => {
  await login(page, users.admin);
  await expect(page.getByRole('row', { name: /Standing desk/ }).getByTestId('item-count')).toHaveText('2');
  await expect(page.getByRole('row', { name: /Monitor arm/ }).getByTestId('item-count')).toHaveText('1');
});
