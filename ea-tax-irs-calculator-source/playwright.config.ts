import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    // Invokes node directly rather than `npm run` — on Windows, npm's
    // .cmd shim script breaks when the project path contains a "&"
    // (as this one does), because the shim's internal path handling
    // isn't quote-safe. Calling node.exe directly against the Next.js
    // binary sidesteps that shim entirely.
    command: "node ./node_modules/next/dist/bin/next build && node ./node_modules/next/dist/bin/next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
