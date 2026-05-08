import { defineConfig, devices } from '@playwright/test';
import { config, STORAGE_STATE } from './src/utils/config';

const BASE_URL = config.baseUrl;

// Each run writes artifacts into a timestamped sub-directory so historical
// reports are never overwritten. Pass RUN_TS=<value> from CI to use a fixed
// label (e.g. the build number); otherwise generate one automatically.
const RUN_TS =
  process.env.RUN_TS ??
  new Date().toISOString().replace(/T/, '_').replace(/[:.]/g, '-').slice(0, 19);

// Set BROWSER=chromium|firefox|webkit|all in .env to control which browser runs.
// Defaults to 'chromium' when not set.
const BROWSER = (process.env.BROWSER ?? 'chromium').toLowerCase();

const DEVICE_MAP: Record<string, (typeof devices)[string]> = {
  chromium: devices['Desktop Chrome'],
  firefox:  devices['Desktop Firefox'],
  webkit:   devices['Desktop Safari'],
};

// Resolved device for the no-auth project (falls back to Chrome if unknown value).
const selectedDevice = DEVICE_MAP[BROWSER] ?? devices['Desktop Chrome'];

export default defineConfig({
  testDir: './tests',
  outputDir: `./test-results/${RUN_TS}`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : '50%',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: `reports/html/${RUN_TS}`, open: 'never' }],
    ['json', { outputFile: `reports/json/${RUN_TS}/results.json` }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true, suiteTitle: true }],
    ['./src/reporters/kpi-reporter.ts',  { outputFile: `reports/kpi/${RUN_TS}/summary.md` }],
    ['./src/reporters/html-reporter.ts', { outputDir: `reports/advanced/${RUN_TS}`, autoOpen: true }],
  ],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 10_000,
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    // viewport: null lets Playwright use the real OS window size instead of a
    // fixed resolution. Combined with --start-maximized on Chromium this gives
    // a truly full-screen window; on Firefox/WebKit it opens at the system default.
    viewport: process.env.CI ? { width: 1920, height: 1080 } : null,
    launchOptions: {
      args: [
        ...(!process.env.CI ? ['--start-maximized'] : []),
        '--disable-blink-features=AutomationControlled',
      ],
    },
  },
  projects: [
    // Auth setup — always runs as a dependency of the browser projects.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
    },

    // Authenticated browser projects — filtered by the BROWSER env var.
    // BROWSER=all runs every entry; any other value keeps only the matching one.
    ...[
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          viewport: process.env.CI ? { width: 1920, height: 1080 } : null,
          deviceScaleFactor: undefined,
          storageState: STORAGE_STATE,
        },
        dependencies: ['setup'],
        testIgnore: ['**/login.spec.ts', '**/forgot-password.spec.ts'],
      },
      {
        name: 'firefox',
        use: {
          ...devices['Desktop Firefox'],
          viewport: process.env.CI ? { width: 1920, height: 1080 } : null,
          deviceScaleFactor: undefined,
          storageState: STORAGE_STATE,
        },
        dependencies: ['setup'],
        testIgnore: ['**/login.spec.ts', '**/forgot-password.spec.ts'],
      },
    ].filter((p) => BROWSER === 'all' || p.name === BROWSER),

    // Unauthenticated tests (login, forgot-password) — uses the selected browser.
    {
      name: 'no-auth',
      use: {
        ...selectedDevice,
        viewport: process.env.CI ? { width: 1920, height: 1080 } : null,
        deviceScaleFactor: undefined,
      },
      testMatch: ['**/login.spec.ts', '**/forgot-password.spec.ts'],
    },
  ],
});

export { BASE_URL };
