/**
 * Smoke walk over every static authenticated route.
 *
 * Strategy:
 *   1. The setup project handles login once → storageState reused.
 *   2. For each parameterless route, navigate and assert:
 *      - The URL still contains the route path (we weren't bounced to /login).
 *      - No global error boundary / 5xx page is shown.
 *   3. Dynamic routes (those with `:param`) are listed under DynamicRoutes
 *      in src/utils/routes.ts and exercised by their feature-specific tests.
 */
import { test, expect } from '../src/fixtures/serial';
import { urlFor } from '../src/utils/config';
import { staticAuthRoutes } from '../src/utils/routes';

for (const path of staticAuthRoutes()) {
  test(`@smoke route ${path} loads`, async ({ page, stepLogger }) => {
    await test.step(`Navigate to ${path}`, async () => {
      const fullUrl = urlFor(path);
      stepLogger.info(`Navigating to ${fullUrl}`);
      await page.goto(fullUrl);
      stepLogger.info(`Post-goto URL: ${page.url()}`);
    });

    await test.step('Wait for page ready', async () => {
      stepLogger.info('Waiting for document.readyState === complete');
      await page.waitForFunction(() => document.readyState === 'complete', null, {
        timeout: 20_000,
      });

      stepLogger.info('Waiting for main layout element to attach');
      await page
        .locator('main, .ant-layout, #root > div')
        .first()
        .waitFor({ state: 'attached', timeout: 15_000 });

      stepLogger.info(`Page ready — URL: ${page.url()}`);
    });

    await test.step('Assert no auth redirect', async () => {
      const current = page.url();
      stepLogger.info(`Final URL: ${current}`);

      if (current.includes('/login') || current.includes('auth0.com')) {
        stepLogger.error(`BOUNCED TO LOGIN — storageState may be expired or missing. URL: ${current}`);
      }

      expect(
        current,
        `Route ${path} bounced to login — session may have expired. Final URL: ${current}`,
      ).not.toContain('/login');

      const segment = path.split('/')[1] ?? '';
      expect(
        current,
        `Route ${path} did not load — final URL was "${current}"`,
      ).toContain(segment);
    });

    await test.step('Assert no React error boundary', async () => {
      const errorBoundaries = page.locator(
        "[class*='error-boundary'], .error-page, [class*='ErrorBoundary']",
      );
      const errCount = await errorBoundaries.count();
      stepLogger.info(`Error boundaries found on page: ${errCount}`);
      for (let i = 0; i < errCount; i++) {
        const visible = await errorBoundaries.nth(i).isVisible();
        if (visible) {
          stepLogger.error(`Error boundary ${i} is visible on route ${path}`);
        }
        expect(visible, `Route ${path} rendered an error boundary`).toBe(false);
      }
    });
  });
}
