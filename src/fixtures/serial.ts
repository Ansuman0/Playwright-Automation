/**
 * Worker-scoped browser fixtures for sequential smoke runs.
 *
 * Normal Playwright behaviour: each test gets a NEW BrowserContext → new window
 * opens and closes for every test.
 *
 * This fixture flips that: the BrowserContext (and its page) lives for the
 * entire worker lifetime.  With --workers=1 (set in test:smoke) that means ONE
 * browser window stays open from the first test to the last.
 *
 * Usage
 *   import { test, expect } from '../src/fixtures/serial';
 *
 * Run condition
 *   Always pair with --workers=1.  The test:smoke script already sets this.
 */

import * as fs from 'fs';
import { test as base, BrowserContext, Page } from '@playwright/test';
import { STORAGE_STATE } from '../utils/config';
import { getLogger } from '../utils/logger';
import type { StepLogger } from './index';

export const test = base.extend<
  { stepLogger: StepLogger; page: Page },
  { _workerCtx: BrowserContext; _workerPage: Page }
>({
  // ── Worker-scoped: created ONCE, shared by all tests in this worker ──────

  _workerCtx: [
    async ({ browser }, use) => {
      const log = getLogger('serial:context');
      const storageExists = fs.existsSync(STORAGE_STATE);
      log.info(`STORAGE_STATE : ${STORAGE_STATE}  (exists: ${storageExists})`);

      if (!storageExists) {
        log.warn(
          'storageState file not found — browser context will be unauthenticated. ' +
          'Run the full test suite once so the setup project can create .auth/user.json.',
        );
      }

      const ctx = await browser.newContext({
        ...(storageExists ? { storageState: STORAGE_STATE } : {}),
        viewport: null,
      });

      log.info('Shared browser context created — window will stay open for all tests');
      await use(ctx);

      log.info('All tests done — closing shared browser context');
      await ctx.close();
    },
    { scope: 'worker' },
  ],

  _workerPage: [
    async ({ _workerCtx }, use) => {
      const log = getLogger('serial:page');
      log.info('Opening shared browser page');
      const pg = await _workerCtx.newPage();
      await use(pg);
      // Page cleanup is handled by context.close() above
    },
    { scope: 'worker' },
  ],

  // ── Test-scoped: wraps the shared page, attaches screenshot on failure ───

  page: async ({ _workerPage }, use, testInfo) => {
    await use(_workerPage);

    if (testInfo.status !== testInfo.expectedStatus) {
      try {
        const shot = await _workerPage.screenshot({ fullPage: true });
        await testInfo.attach('failure-screenshot', {
          body: shot,
          contentType: 'image/png',
        });
      } catch {
        // Page may have crashed — screenshot is best-effort
      }
    }
  },

  // ── Test-scoped: logs to console + attaches as report annotations ─────────

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
});

export { expect } from '@playwright/test';
