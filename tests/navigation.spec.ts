/** Top-nav clicks — verifies nav links resolve correctly without manual URL entry. */
import { test, expect } from '../src/fixtures/serial';
import { DashboardPage } from '../src/pages/dashboard-page';
import { HeaderPage } from '../src/pages/header-page';
import { AuthRoutes } from '../src/utils/routes';

const NAV_TARGETS: Array<[string, string]> = [
  ['/dashboard', AuthRoutes.DASHBOARD],
  ['/wallets', '/wallets'],
  ['/cards', '/cards'],
  ['/exchange', '/exchange'],
  ['/banks', '/banks'],
  ['/payments', '/payments'],
  ['/transactions', AuthRoutes.TRANSACTIONS],
  ['/payees', '/payees'],
  ['/notifications', AuthRoutes.NOTIFICATIONS],
  ['/rewards', '/rewards'],
];

test.beforeEach(async ({ page, stepLogger }) => {
  await test.step('Open dashboard before nav test', async () => {
    stepLogger.info(`beforeEach: opening dashboard — current URL: ${page.url()}`);
    await new DashboardPage(page).open();
    stepLogger.info(`beforeEach: dashboard ready — URL: ${page.url()}`);
  });
});

for (const [hrefSubstr, expectedInUrl] of NAV_TARGETS) {
  test(`@smoke nav link to ${hrefSubstr} navigates`, async ({ page, stepLogger }) => {
    const header = new HeaderPage(page);

    const linkVisible = await test.step(`Check nav link visibility for ${hrefSubstr}`, async () => {
      const visible = await header.navLinkVisible(hrefSubstr);
      stepLogger.info(`Nav link "${hrefSubstr}" visible: ${visible}`);
      return visible;
    });

    if (!linkVisible) {
      stepLogger.warn(`Nav link for "${hrefSubstr}" not found in menu — skipping`);
      test.skip(true, `Nav link for ${hrefSubstr} not present in this client's menu`);
      return;
    }

    await test.step(`Click nav link ${hrefSubstr}`, async () => {
      stepLogger.info(`Clicking nav link: ${hrefSubstr}  — pre-click URL: ${page.url()}`);
      await header.navClick(hrefSubstr);
      stepLogger.info(`Post-click URL: ${page.url()}`);
    });

    await test.step(`Assert URL contains ${expectedInUrl}`, async () => {
      const currentUrl = page.url();
      stepLogger.info(`Asserting "${currentUrl}" contains "${expectedInUrl}"`);
      expect(
        currentUrl,
        `Nav to ${hrefSubstr} failed — expected URL to contain "${expectedInUrl}" but got "${currentUrl}"`,
      ).toContain(expectedInUrl);
    });
  });
}
