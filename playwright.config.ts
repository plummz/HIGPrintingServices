import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3000",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
          args: ["--no-sandbox"],
        }
      : {},
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
