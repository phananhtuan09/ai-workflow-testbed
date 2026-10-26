import { test as base, expect, type Page } from '@playwright/test';

export const users = {
  admin: { username: 'admin', password: 'admin123', displayName: 'Ada Admin' },
  alice: { username: 'alice', password: 'alice123', displayName: 'Alice User' },
  bob: { username: 'bob', password: 'bob123', displayName: 'Bob User' },
} as const;

export async function login(page: Page, user: (typeof users)[keyof typeof users]) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
}

export const test = base.extend({
  page: async ({ page, request }, use) => {
    const reset = await request.post('/api/test/reset');
    expect(reset.status()).toBe(204);
    await use(page);
  },
});

export { expect };
