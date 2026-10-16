import { defineConfig, devices } from '@playwright/test';

// webServer is global in Playwright. Content/geometry units need neither a
// browser nor a built site; keep the documented unit command independent.
const unitOnly = process.argv.includes('--project=unit') || process.argv.some(
  (argument, index) => argument === '--project' && process.argv[index + 1] === 'unit',
);
const baseURL = 'http://127.0.0.1:4173/ai-workflow/';

export default defineConfig({
  testDir: './tests',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  projects: [
    {
      name: 'unit',
      testMatch: /(?:content|geometry)\.spec\.ts$/,
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /(?:content|geometry)\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        baseURL,
        trace: 'retain-on-failure',
      },
    },
  ],
  webServer: unitOnly ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
