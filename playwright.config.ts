import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./05-e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "iphone",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: `node_modules/.bin/next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...process.env,
      NEXTACT_ALLOW_DEMO: "1",
    },
  },
});
