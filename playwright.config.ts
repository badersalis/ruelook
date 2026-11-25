import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL targets the live site (e.g. https://badersalis.github.io/ruelook);
// otherwise the built export in ./out is served locally under /ruelook.
const live = process.env.E2E_BASE_URL;
const baseURL = (live ?? "http://127.0.0.1:4173/ruelook").replace(/\/$/, "") + "/";

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 2, // gentle on the Supabase free tier
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: live
    ? undefined
    : { command: "node scripts/serve-export.mjs", url: "http://127.0.0.1:4173/ruelook/", reuseExistingServer: true },
});
