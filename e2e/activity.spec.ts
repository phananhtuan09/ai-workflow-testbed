import { expect, login, test, users } from './fixtures';

test('an order shows its history after it is created and edited', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'New order' }).click();
  await page.getByLabel('Name').fill('Desk lamp');
  await page.getByLabel('Price').fill('25.50');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Desk lamp' })).toBeVisible();

  const history = page.getByRole('list', { name: 'Activity' });
  await expect(history.getByRole('listitem')).toHaveCount(1);
  await expect(history).toContainText('Alice User created the order');

  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByLabel('Name').fill('Desk lamp XL');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Desk lamp XL' })).toBeVisible();

  await expect(history.getByRole('listitem')).toHaveCount(2);
  await expect(history.getByRole('listitem').first()).toContainText('Alice User edited the order');
});

test('an admin sees every event on the activity page', async ({ page }) => {
  await login(page, users.admin);
  await page.getByRole('link', { name: 'Activity' }).click();
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();

  const events = page.getByRole('list', { name: 'Activity' }).getByRole('listitem');
  await expect(events).toHaveCount(4);
  await expect(events.first()).toContainText('Ada Admin created the order Office chair');
});

test('a regular user has no activity link', async ({ page }) => {
  await login(page, users.bob);
  await expect(page.getByRole('link', { name: 'Activity' })).toHaveCount(0);
});
