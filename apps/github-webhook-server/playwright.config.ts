import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'api-tests',
      testMatch: '**/*.e2e.ts',
      use: {
        ignoreHTTPSErrors: true,
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      GITHUB_APP_ID: '123456',
      GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!,
      GITHUB_WEBHOOK_SECRET: 'test-webhook-secret',
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-client-secret',
      NUCEL_DOMAIN: 'test.nucel.cloud',
    },
  },
});