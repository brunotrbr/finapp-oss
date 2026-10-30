import { defineConfig, devices } from "@playwright/test";

process.env.FINAPP_E2E_AUTH = "1";
process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH = "1";
process.env.NEXT_PUBLIC_FINAPP_DATA_SOURCE ??= "demo";
const port = process.env.FINAPP_E2E_PORT ?? "3100";
const isolatedServer = process.env.FINAPP_E2E_PORT !== undefined;

export default defineConfig({
  testDir: "./e2e",
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
    { name: "tablet-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    ...(isolatedServer ? { command: `npm run dev -- --hostname 127.0.0.1 --port ${port}` } : {}),
    url: `http://127.0.0.1:${port}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
