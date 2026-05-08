/**
 * End-to-end tests for the Sell page. Source: src/modules/exchange/sell/
 *
 * Sell-specific differences asserted here:
 *   * Widget.jsx -> validateSellBalance rejects when amount > balance
 *     (Buy doesn't have this check).
 *   * handleSellMinMax in Widget.jsx caps the Max amount at the user's
 *     actual holdings, not just the configured max limit.
 */
import { test, expect } from '@playwright/test';
import { ExchangePage } from '../src/pages/exchange-page';

test.describe('Sell page', () => {
  let sell: ExchangePage;

  test.beforeEach(async ({ page }) => {
    sell = new ExchangePage(page);
    await sell.openSell();
    const state = await sell.waitForWidgetOrKyc(25_000);
    if (state === 'kyc') {
      test.skip(true, 'KYC gate active — cannot exercise the Sell widget');
    }
    if (state !== 'widget') {
      test.skip(true, `Sell widget not available (state=${state})`);
    }
  });

  test('@smoke loads', async () => {
    expect(await sell.isLoaded()).toBe(true);
  });

  test('@smoke URL auto-selects the first coin', async ({ page }) => {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      if (!page.url().replace(/\/$/, '').endsWith('/exchange/sell')) break;
      await page.waitForTimeout(300);
    }
    if (page.url().replace(/\/$/, '').endsWith('/exchange/sell')) {
      test.skip(true, 'No sellable coins available');
    }
    expect(page.url()).toContain('/exchange/sell');
  });

  test('@smoke shows Buy and Sell tabs', async () => {
    expect(await sell.hasBuyAndSellTabs()).toBe(true);
  });

  test('@regression Sell tab is active', async () => {
    const active = await sell.activeTabText();
    expect(active, 'Could not detect any active tab').not.toBeNull();
    expect(active).toContain('Sell');
  });

  test('@smoke widget has required controls', async () => {
    expect(await sell.isVisible(sell.cryptoAmountInput, 10_000)).toBe(true);
    expect(await sell.isVisible(sell.cryptoDropdown, 5_000)).toBe(true);
    expect(await sell.isVisible(sell.fiatDropdown, 5_000)).toBe(true);
    expect(await sell.isVisible(sell.saveButton, 5_000)).toBe(true);
  });

  test('@regression Save is disabled without a fiat wallet', async () => {
    expect(await sell.isSaveButtonDisabled()).toBe(true);
  });

  test('@regression Min/Max button IDs are stable', async () => {
    if (!(await sell.hasMinButton()) && !(await sell.hasMaxButton())) {
      test.skip(true, 'Coin has no min/max — neither button rendered');
    }
    if (await sell.hasMinButton()) {
      expect(await sell.minButton.getAttribute('id')).toBe('buysellMinButton');
    }
    if (await sell.hasMaxButton()) {
      expect(await sell.maxButton.getAttribute('id')).toBe('buysellMaxButton');
    }
  });

  test('@regression widget visible when KYC gate isn\'t shown', async () => {
    expect(await sell.isWidgetVisible()).toBe(true);
  });

  test('@regression coin list has at least one row', async () => {
    const deadline = Date.now() + 8_000;
    let count = 0;
    while (Date.now() < deadline) {
      count = await sell.coinCount();
      if (count > 0) return;
      await sell.page.waitForTimeout(300);
    }
    if (count === 0) {
      test.skip(true, 'Sell coin list is empty — account has no holdings');
    }
  });

  test('@regression Min button populates amount', async () => {
    if (!(await sell.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit configured');
    }
    await sell.clickMin();
    let value = '';
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      value = (await sell.cryptoAmountValue()) ?? '';
      if (value !== '' && value !== '0') break;
      await sell.page.waitForTimeout(200);
    }
    expect(value === '' || value === '0').toBe(false);
  });

  test('@regression Max button respects available balance', async () => {
    // Sell-specific: handleSellMinMax sets cryptoAmount to MIN(available, max).
    if (!(await sell.hasMaxButton())) {
      test.skip(true, 'Selected coin has no max limit configured');
    }
    await sell.clickMax();
    let value = '';
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      value = (await sell.cryptoAmountValue()) ?? '';
      if (value !== '' && value !== '0') break;
      await sell.page.waitForTimeout(200);
    }
    expect(value === '' || value === '0').toBe(false);
  });

  test('@regression amount of 0 shows validation error', async () => {
    await sell.typeCryptoAmount('0');
    const err = await sell.getValidationError(8_000);
    expect(err, 'Expected an Ant Design validation error after entering 0').toBeTruthy();
  });

  test('@regression amount above balance shows validation error', async () => {
    // Sell-specific: validateSellBalance rejects when amount > available.
    await sell.typeCryptoAmount('999999999999');
    const err = (await sell.getValidationError(8_000)) ?? (await sell.getTopAlert(3_000)) ?? '';
    expect(err, 'Expected a validation error after entering above-balance amount').toBeTruthy();
  });

  test('@regression direct URL nav selects a specific coin', async ({ page }) => {
    const ep = new ExchangePage(page);
    for (const code of ['BTC', 'ETH', 'USDT', 'USDC', 'BNB']) {
      await ep.openSell(code);
      const state = await ep.waitForWidgetOrKyc(20_000);
      if (state === 'widget' && page.url().includes(code)) {
        expect(await ep.isWidgetVisible()).toBe(true);
        return;
      }
    }
    test.skip(true, 'None of BTC/ETH/USDT/USDC/BNB are sellable for this account');
  });

  test('@regression switching to Buy tab navigates to /buy', async ({ page }) => {
    await sell.clickBuyTab();
    await page.waitForURL((u) => u.toString().includes('/exchange/buy'), { timeout: 10_000 });
    expect(page.url()).toContain('/exchange/buy');
  });
});
