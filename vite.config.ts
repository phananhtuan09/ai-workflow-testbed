import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const apiPort = process.env.API_PORT ?? '3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
    strictPort: true,
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'shared/**/*.test.ts', 'server/**/*.test.ts'],
  },
});
