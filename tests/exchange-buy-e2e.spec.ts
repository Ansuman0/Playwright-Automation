/**
 * End-to-end Buy flow — exercises the full transactional path.
 *
 * Source under test:
 *   src/modules/exchange/buy/Buy.jsx           (form -> getSummary -> onSuccess)
 *   src/modules/exchange/buy/Layout.jsx        (BuyWithNavigation routing)
 *   src/modules/exchange/buy/Summary.jsx       (Confirm -> handleBuyCrypto)
 *   src/modules/exchange/buy/Success.jsx       (success screen + Buy Again)
 *
 * Tag: @transfer
 *   These tests **execute real transactions** on the dev environment.
 *   They are excluded from the default and smoke runs. To execute:
 *
 *       npm run test:transfer -- tests/exchange-buy-e2e.spec.ts
 *
 * Defensive skips: KYC gate, no fiat wallet, no min limit configured,
 * or conversion failing on the dev backend all auto-skip with a clear reason.
 */
import { test, expect } from '@playwright/test';
import {
  ExchangePage,
  ExchangeSuccessPage,
  ExchangeSummaryPage,
} from '../src/pages/exchange-page';

test.describe('Buy end-to-end @transfer', () => {
  let buy: ExchangePage;

  test.beforeEach(async ({ page }) => {
    buy = new ExchangePage(page);
    await buy.openBuy();
    const state = await buy.waitForWidgetOrKyc(25_000);
    if (state === 'kyc') {
      test.skip(true, 'KYC gate active — cannot exercise the Buy flow');
    }
    if (state !== 'widget') {
      test.skip(true, `Buy widget not available (state=${state})`);
    }
  });

  // ---------- step 1: fiat selection enables save ----------
  test('@transfer selecting fiat wallet enables Save after Min', async () => {
    expect(await buy.isSaveButtonDisabled(), 'Save should start disabled').toBe(true);

    if (!(await buy.selectFiatFirstOption())) {
      test.skip(true, 'No fiat wallets available for this account');
    }

    expect(
      await buy.isSaveButtonDisabled(),
      'Save should remain disabled until an amount is entered',
    ).toBe(true);

    if (!(await buy.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit; cannot exercise Save-enable');
    }
    await buy.clickMin();

    expect(
      await buy.waitForSaveEnabled(20_000),
      'Save should enable after fiat + amount are set',
    ).toBe(true);
  });

  // ---------- step 2: save -> summary (non-destructive) ----------
  test('@transfer Save navigates to summary', async ({ page }) => {
    // Clicking Save fetches a quote (fetchBuySummary) and navigates to
    // /exchange/buy/<coin>/summary/<isCrypto>. No money has moved yet —
    // the actual transaction only fires on Confirm.
    if (!(await buy.selectFiatFirstOption())) {
      test.skip(true, 'No fiat wallets available');
    }
    if (!(await buy.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit configured');
    }
    await buy.clickMin();
    if (!(await buy.waitForSaveEnabled(20_000))) {
      test.skip(true, 'Save did not enable — conversion may have failed');
    }

    await buy.clickSave();
    await page.waitForURL((u) => u.toString().includes('/summary/'), { timeout: 40_000 });

    const summary = new ExchangeSummaryPage(page);
    await expect(summary.confirmButton, 'Confirm button missing on summary').toBeVisible({
      timeout: 20_000,
    });
  });

  // ---------- step 3: full e2e (executes a real transaction) ----------
  test('@transfer complete Buy flow executes a real transaction', async ({ page }) => {
    if (!(await buy.selectFiatFirstOption())) {
      test.skip(true, 'No fiat wallets available');
    }
    if (!(await buy.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit');
    }
    await buy.clickMin();

    if (!(await buy.waitForSaveEnabled(20_000))) {
      const topAlert = (await buy.getTopAlert(2_000)) ?? '';
      test.skip(true, `Save did not enable; top alert: ${topAlert}`);
    }

    await buy.clickSave();

    const summary = new ExchangeSummaryPage(page);
    try {
      await summary.waitUntilLoaded(40_000);
    } catch {
      const err = await summary.getErrorMessage();
      throw new Error(
        `Summary did not load. Last error: ${err}; URL: ${page.url()}`,
      );
    }

    // Click Confirm — this fires the real handleBuyCrypto API call.
    await summary.confirm();

    const success = new ExchangeSuccessPage(page);
    try {
      await success.waitUntilLoaded(90_000);
    } catch {
      const err = await summary.getErrorMessage();
      throw new Error(
        `Did not reach /success after Confirm. Last error: ${err}; URL: ${page.url()}`,
      );
    }

    expect(success.isLoaded(), 'Reached success URL but page did not render').toBe(true);

    // Bonus: "Buy Again" button should round-trip back to the form.
    if (await success.isAgainVisible()) {
      await success.clickAgain();
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        if (!page.url().includes('/success')) break;
        await page.waitForTimeout(200);
      }
      expect(page.url(), 'Buy Again did not navigate away from /success').not.toContain(
        '/success',
      );
    }
  });
});
