import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.WEB_PORT ?? 5173);
const apiPort = Number(process.env.API_PORT ?? 3001);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${webPort}/api/health`,
    reuseExistingServer: !process.env.CI,
    env: {
      WEB_PORT: String(webPort),
      API_PORT: String(apiPort),
      DATA_DIR: process.env.DATA_DIR ?? '.data/e2e',
      TEST_MODE: '1',
      FIXED_NOW: process.env.FIXED_NOW ?? '2026-02-01T08:00:00.000Z',
    },
  },
});
