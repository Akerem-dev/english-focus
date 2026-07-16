import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./testing/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: "line",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "msedge",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1180, height: 760 }
  },
  webServer: {
    command: "npm run preview --workspace=@app/desktop -- --host 127.0.0.1 --port 4173",
    reuseExistingServer: false,
    timeout: 30_000,
    url: "http://127.0.0.1:4173"
  }
});
