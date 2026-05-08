import { test as base, expect } from '@playwright/test';
import { getLogger } from '../utils/logger';

export interface StepLogger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}

/**
 * Extended test fixture that provides:
 * - `stepLogger`: writes timestamped messages to console AND attaches them as
 *   annotations visible in the Playwright HTML report.
 * - Automatic extra screenshot attached to the report on failure (supplements
 *   the built-in `screenshot: 'only-on-failure'` which saves to disk).
 */
export const test = base.extend<{ stepLogger: StepLogger }>({
  stepLogger: async ({}, use, testInfo) => {
    const log = getLogger(testInfo.title);

    await use({
      info: (msg) => {
        log.info(msg);
        testInfo.annotations.push({ type: 'log:info', description: msg });
      },
      warn: (msg) => {
        log.warn(msg);
        testInfo.annotations.push({ type: 'log:warn', description: msg });
      },
      error: (msg) => {
        log.error(msg);
        testInfo.annotations.push({ type: 'log:error', description: msg });
      },
    });
  },

  // Attach an inline screenshot to the HTML report body on failure so the
  // image is embedded directly in the report page (not just a download link).
  page: async ({ page }, use, testInfo) => {
    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  },
});

export { expect };
