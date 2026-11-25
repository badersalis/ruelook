import { defineConfig, devices } from "@playwright/test";

// Screen capture for design docs (not part of CI): `npx playwright test -c scripts/capture/playwright.capture.config.ts`.
// Frame sizes match the Figma UI frames: mobile 390×844, desktop 1440×1024.
const baseURL = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173/ruelook").replace(/\/$/, "") + "/";

export default defineConfig({
  testDir: ".",
  testMatch: "screens.spec.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [["list"]],
  use: { baseURL, reducedMotion: "reduce", colorScheme: "light", locale: "en-GB" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "node scripts/serve-export.mjs", cwd: "../..", url: "http://127.0.0.1:4173/ruelook/", reuseExistingServer: true },
});
