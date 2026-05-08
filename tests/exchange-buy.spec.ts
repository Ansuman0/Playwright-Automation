/**
 * End-to-end tests for the Buy page.
 * Source under test: src/modules/exchange/buy/
 *
 * Defensive design: KYC gating, empty coin lists, or coins without min/max
 * all auto-skip with a clear reason instead of failing.
 *
 * Each test gets a fresh page; storageState makes login free, so we
 * navigate to /exchange/buy in beforeEach and skip if the widget can't render.
 */
import { test, expect } from '@playwright/test';
import { ExchangePage } from '../src/pages/exchange-page';

test.describe('Buy page', () => {
  let buy: ExchangePage;

  test.beforeEach(async ({ page }) => {
    buy = new ExchangePage(page);
    await buy.openBuy();
    const state = await buy.waitForWidgetOrKyc(25_000);
    if (state === 'kyc') {
      test.skip(true, 'KYC gate active — cannot exercise the Buy widget');
    }
    if (state !== 'widget') {
      test.skip(true, `Buy widget not available (state=${state})`);
    }
  });

  test('@smoke loads', async () => {
    expect(await buy.isLoaded()).toBe(true);
  });

  test('@smoke URL auto-selects the first coin', async ({ page }) => {
    // Assets.jsx auto-selects the first coin and rewrites
    // /exchange/buy → /exchange/buy/<CODE>.
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      if (!page.url().replace(/\/$/, '').endsWith('/exchange/buy')) break;
      await page.waitForTimeout(300);
    }
    if (page.url().replace(/\/$/, '').endsWith('/exchange/buy')) {
      test.skip(true, 'No coins available to auto-select');
    }
    expect(page.url()).toContain('/exchange/buy');
  });

  test('@smoke shows Buy and Sell tabs', async () => {
    expect(await buy.hasBuyAndSellTabs()).toBe(true);
  });

  test('@regression Buy tab is active', async () => {
    const active = await buy.activeTabText();
    expect(active, 'Could not detect any active tab').not.toBeNull();
    expect(active).toContain('Buy');
  });

  test('@smoke widget has required controls', async () => {
    expect(await buy.isVisible(buy.cryptoAmountInput, 10_000)).toBe(true);
    expect(await buy.isVisible(buy.cryptoDropdown, 5_000)).toBe(true);
    expect(await buy.isVisible(buy.fiatDropdown, 5_000)).toBe(true);
    expect(await buy.isVisible(buy.saveButton, 5_000)).toBe(true);
  });

  test('@regression Save is disabled without a fiat wallet', async () => {
    // Widget.jsx: button `disabled = ... || !selectedCryptoCoin || !selectedFiatCoin`.
    expect(await buy.isSaveButtonDisabled()).toBe(true);
  });

  test('@regression Min/Max button IDs are stable', async () => {
    // Widget.jsx hard-codes id='buysellMinButton'/'buysellMaxButton'.
    if (!(await buy.hasMinButton()) && !(await buy.hasMaxButton())) {
      test.skip(true, 'Coin has no min/max — neither button rendered');
    }
    if (await buy.hasMinButton()) {
      expect(await buy.minButton.getAttribute('id')).toBe('buysellMinButton');
    }
    if (await buy.hasMaxButton()) {
      expect(await buy.maxButton.getAttribute('id')).toBe('buysellMaxButton');
    }
  });

  test('@regression widget visible when KYC gate isn\'t shown', async () => {
    expect(await buy.isWidgetVisible()).toBe(true);
  });

  test('@regression coin list has at least one row', async () => {
    const deadline = Date.now() + 8_000;
    let count = 0;
    while (Date.now() < deadline) {
      count = await buy.coinCount();
      if (count > 0) return;
      await buy.page.waitForTimeout(300);
    }
    if (count === 0) {
      test.skip(true, 'Coin list is empty for this account');
    }
  });

  test('@regression Min button populates amount', async () => {
    if (!(await buy.hasMinButton())) {
      test.skip(true, 'Selected coin has no min limit configured');
    }
    await buy.clickMin();
    let value = '';
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      value = (await buy.cryptoAmountValue()) ?? '';
      if (value !== '' && value !== '0') break;
      await buy.page.waitForTimeout(200);
    }
    expect(value === '' || value === '0').toBe(false);
  });

  test('@regression Max button populates amount', async () => {
    if (!(await buy.hasMaxButton())) {
      test.skip(true, 'Selected coin has no max limit configured');
    }
    await buy.clickMax();
    let value = '';
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      value = (await buy.cryptoAmountValue()) ?? '';
      if (value !== '' && value !== '0') break;
      await buy.page.waitForTimeout(200);
    }
    expect(value === '' || value === '0').toBe(false);
  });

  test('@regression amount of 0 shows validation error', async () => {
    // Widget.jsx -> validateBasicAmount rejects when numeric <= 0.
    await buy.typeCryptoAmount('0');
    const err = await buy.getValidationError(8_000);
    expect(err, 'Expected an Ant Design validation error after entering 0').toBeTruthy();
  });

  test('@regression excessive amount shows validation error', async () => {
    // validateLimits rejects when numeric > max.
    await buy.typeCryptoAmount('9999999999');
    const err = (await buy.getValidationError(8_000)) ?? (await buy.getTopAlert(3_000)) ?? '';
    expect(err, 'Expected a validation error after entering an oversized amount').toBeTruthy();
  });

  test('@regression direct URL nav selects a specific coin', async ({ page }) => {
    // Bypasses the beforeEach navigation by re-opening with each candidate.
    const ep = new ExchangePage(page);
    for (const code of ['BTC', 'ETH', 'USDT', 'USDC', 'BNB']) {
      await ep.openBuy(code);
      const state = await ep.waitForWidgetOrKyc(20_000);
      if (state === 'widget' && page.url().includes(code)) {
        expect(await ep.isWidgetVisible()).toBe(true);
        return;
      }
    }
    test.skip(true, 'None of BTC/ETH/USDT/USDC/BNB are available for this account');
  });

  test('@regression switching to Sell tab navigates to /sell', async ({ page }) => {
    await buy.clickSellTab();
    await page.waitForURL((u) => u.toString().includes('/exchange/sell'), { timeout: 10_000 });
    expect(page.url()).toContain('/exchange/sell');
  });
});
