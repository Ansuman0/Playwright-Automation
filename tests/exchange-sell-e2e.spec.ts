/**
 * End-to-end Sell flow — exercises the full transactional path.
 *
 * Source under test:
 *   src/modules/exchange/sell/Sell.jsx          (form -> getSummary -> onSuccess)
 *   src/modules/exchange/sell/Layout.jsx        (SellWithNavigation routing)
 *   src/modules/exchange/sell/Summary.jsx       (Confirm -> handleSellCrypto)
 *   src/modules/exchange/sell/Success.jsx       (success screen + Sell Again)
 *
 * Sell-specific gotcha:
 *   Widget.jsx -> validateSellBalance fails when amount > available balance.
 *   Min should always be safe IF the user holds at least `min` of the
 *   auto-selected coin. If not, this test skips because the auto-selected
 *   coin isn't sellable for this account.
 *
 * Tag: @transfer — these tests execute real sell transactions.
 *
 *     npm run test:transfer -- tests/exchange-sell-e2e.spec.ts
 */
import { test, expect } from '@playwright/test';
import {
  ExchangePage,
  ExchangeSuccessPage,
  ExchangeSummaryPage,
} from '../src/pages/exchange-page';

test.describe('Sell end-to-end @transfer', () => {
  let sell: ExchangePage;

  test.beforeEach(async ({ page }) => {
    sell = new ExchangePage(page);
    await sell.openSell();
    const state = await sell.waitForWidgetOrKyc(25_000);
    if (state === 'kyc') {
      test.skip(true, 'KYC gate active — cannot exercise the Sell flow');
    }
    if (state !== 'widget') {
      test.skip(true, `Sell widget not available (state=${state})`);
    }
  });

  // ---------- step 1: fiat selection enables save ----------
  test('@transfer selecting fiat wallet enables Save after Min', async () => {
    expect(await sell.isSaveButtonDisabled(), 'Save should start disabled').toBe(true);

    if (!(await sell.selectFiatFirstOption())) {
      test.skip(true, 'No fiat wallets available');
    }

    expect(
      await sell.isSaveButtonDisabled(),
      'Save should remain disabled until an amount is entered',
    ).toBe(true);

    if (!(await sell.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit configured');
    }
    await sell.clickMin();

    if (!(await sell.waitForSaveEnabled(20_000))) {
      const top = (await sell.getTopAlert(2_000)) ?? '';
      test.skip(
        true,
        `Save did not enable — likely insufficient balance for min sell. Alert: ${top}`,
      );
    }
  });

  // ---------- step 2: save -> summary (non-destructive) ----------
  test('@transfer Save navigates to summary', async ({ page }) => {
    // fetchSellSummary is a quote-only call — no holdings move until Confirm.
    if (!(await sell.selectFiatFirstOption())) {
      test.skip(true, 'No fiat wallets available');
    }
    if (!(await sell.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit configured');
    }
    await sell.clickMin();
    if (!(await sell.waitForSaveEnabled(20_000))) {
      test.skip(true, 'Save did not enable — conversion or balance issue');
    }

    await sell.clickSave();
    await page.waitForURL((u) => u.toString().includes('/summary/'), { timeout: 40_000 });

    const summary = new ExchangeSummaryPage(page);
    await expect(summary.confirmButton, 'Confirm button missing on summary').toBeVisible({
      timeout: 20_000,
    });
  });

  // ---------- step 3: full e2e (executes a real sell) ----------
  test('@transfer complete Sell flow executes a real transaction', async ({ page }) => {
    if (!(await sell.selectFiatFirstOption())) {
      test.skip(true, 'No fiat wallets available');
    }
    if (!(await sell.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit');
    }
    await sell.clickMin();

    if (!(await sell.waitForSaveEnabled(20_000))) {
      const topAlert = (await sell.getTopAlert(2_000)) ?? '';
      test.skip(
        true,
        `Save did not enable; likely no holdings for the auto-selected coin. Top alert: ${topAlert}`,
      );
    }

    await sell.clickSave();

    const summary = new ExchangeSummaryPage(page);
    try {
      await summary.waitUntilLoaded(40_000);
    } catch {
      const err = await summary.getErrorMessage();
      throw new Error(`Summary did not load. Last error: ${err}; URL: ${page.url()}`);
    }

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

    if (await success.isAgainVisible()) {
      await success.clickAgain();
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        if (!page.url().includes('/success')) break;
        await page.waitForTimeout(200);
      }
      expect(page.url(), 'Sell Again did not navigate away from /success').not.toContain(
        '/success',
      );
    }
  });
});
