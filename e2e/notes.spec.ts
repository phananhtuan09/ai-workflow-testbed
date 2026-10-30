import { expect, login, test, users } from './fixtures';

test('an owner adds a note with bold text and it persists after reload', async ({ page }) => {
  await login(page, users.alice);
  await page.getByRole('link', { name: 'Monitor arm' }).click();
  await expect(page.getByText('No notes yet.')).toBeVisible();

  await page.getByLabel('Add a note').fill('Ship with the **black** clamp');
  await page.getByRole('button', { name: 'Add note' }).click();

  const note = page.locator('.notes__item').filter({ hasText: 'Ship with the' });
  await expect(note.locator('strong')).toHaveText('black');
  await page.reload();
  await expect(note.locator('strong')).toHaveText('black');
});

test('the orders list shows the number of notes per order', async ({ page }) => {
  await login(page, users.alice);
  await expect(page.getByRole('row', { name: /Standing desk/ })).toContainText('2');
});

test('a user cannot add a note to another user\'s order', async ({ page }) => {
  await login(page, users.bob);
  const response = await page.request.post('/api/orders/1/notes', { data: { body: 'Hello' } });
  expect(response.status()).toBe(404);
});

test('signing in returns to the page that was opened', async ({ page }) => {
  await page.goto('/orders/2');
  await expect(page).toHaveURL(/\/login\?next=%2Forders%2F2$/);
  await page.getByLabel('Username').fill(users.alice.username);
  await page.getByLabel('Password').fill(users.alice.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Monitor arm' })).toBeVisible();
});
