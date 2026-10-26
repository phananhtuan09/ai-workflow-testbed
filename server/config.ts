import path from 'node:path';

export const config = {
  port: Number(process.env.API_PORT ?? 3001),
  dataDir: path.resolve(process.env.DATA_DIR ?? '.data'),
  // Test-only switches; never enable them outside local or CI runs.
  testMode: process.env.TEST_MODE === '1',
  fixedNow: process.env.FIXED_NOW,
  isProduction: process.env.NODE_ENV === 'production',
};
