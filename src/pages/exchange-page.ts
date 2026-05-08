/**
 * Page objects for the Exchange module (Buy & Sell).
 *
 * Source mapping:
 *   - Layout / list / tabs:  src/modules/exchange/buy/Layout.jsx, sell/Layout.jsx
 *   - Widget (form):         src/modules/exchange/Widget.jsx (BuySellWidget)
 *   - Coin list:             src/modules/exchange/{buy,sell}/Assets.jsx
 *   - Validation:            src/modules/exchange/{buy,sell}/Validation.jsx
 *   - Summary / Success:     src/modules/exchange/{buy,sell}/{Summary,Success}.jsx
 *
 * Auto-selection: navigating to /exchange/buy or /exchange/sell triggers
 * Assets.jsx to auto-select the first coin and rewrite the URL to
 * /exchange/buy/<CODE>. waitForWidgetOrKyc polls for either the form
 * OR the KYC gate before assertions.
 *
 * KYC gating: when VITE_KYC_REQUIRED_ON_EXCHANGE=true and the user's
 * kycStatus !== "Approved", the form is replaced by <ActionControlKyc>.
 * Tests should call isKycGateShown() and skip when true.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { urlFor } from '../utils/config';

export type WidgetState = 'widget' | 'kyc' | 'neither';

export class ExchangePage extends BasePage {
  static readonly URL_EXCHANGE = '/exchange';
  static readonly URL_BUY = '/exchange/buy';
  static readonly URL_SELL = '/exchange/sell';

  readonly layoutContainer: Locator = this.page.locator(
    "main, .exchange-widget, [class*='exchange']",
  );

  // Buy/Sell tabs — rendered by ScreenTabs (Ant Design <Tabs>)
  readonly buyTab: Locator = this.page.locator("div[role='tab']:has-text('Buy')");
  readonly sellTab: Locator = this.page.locator("div[role='tab']:has-text('Sell')");
  readonly activeTab: Locator = this.page.locator('.ant-tabs-tab.ant-tabs-tab-active');
  readonly allTabs: Locator = this.page.locator('.ant-tabs-tab');

  // Coin list
  readonly coinSearchInput: Locator = this.page.locator(
    "input.ant-input[type='text'], [class*='search'] input",
  );
  readonly coinListRows: Locator = this.page.locator(
    "[class*='listitem'], [class*='list-item'], .ant-list-item",
  );

  // Widget (form on the right)
  readonly widgetContainer: Locator = this.page.locator(
    '.exchange-widget, .panel-card.buy-card, .panel-card.sell-card',
  );
  readonly cryptoAmountInput: Locator = this.page.locator(
    "input#cryptoAmount, .exchange-widget input[name='from']",
  );
  // Use Playwright .first()/.nth(1) instead of CSS :nth-of-type — the two
  // dropdowns live in different parent containers so :nth-of-type(2) never
  // finds the fiat select even when both have the .ant-select class.
  readonly cryptoDropdown: Locator = this.page
    .locator('.exchange-widget .ant-select')
    .first();
  readonly cryptoSelectorClick: Locator = this.page
    .locator('.exchange-widget .ant-select')
    .first()
    .locator('.ant-select-selector');
  readonly fiatDropdown: Locator = this.page
    .locator('.exchange-widget .ant-select')
    .nth(1);
  readonly fiatSelectorClick: Locator = this.page
    .locator('.exchange-widget .ant-select')
    .nth(1)
    .locator('.ant-select-selector');
  readonly dropdownOption: Locator = this.page.locator('.ant-select-item-option');
  // Options scoped to the currently-open dropdown popup (Ant Design renders
  // dropdowns in a body-level portal; the open one is :not(.ant-select-dropdown-hidden)).
  readonly openDropdownOption: Locator = this.page.locator(
    '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option:not(.ant-select-item-option-disabled)',
  );
  readonly fiatAmountDisplay: Locator = this.page.locator(
    ".exchange-widget [name='to'], .exchange-widget input[disabled]",
  );
  readonly minButton: Locator = this.page.locator('#buysellMinButton');
  readonly maxButton: Locator = this.page.locator('#buysellMaxButton');
  readonly saveButton: Locator = this.page.locator(
    '.exchange-widget button.ant-btn-primary, .panel-card button.ant-btn-primary',
  );

  readonly validationError: Locator = this.page.locator('.ant-form-item-explain-error');
  readonly topAlert: Locator = this.page.locator(
    '.alert-flex, .ant-alert-message, .ant-alert-description',
  );

  readonly kycGateButton: Locator = this.page.locator(
    "button:has-text('KYC'), button:has-text('KYB'), button:has-text('Verify'), button:has-text('Complete')",
  );

  // ---------- navigation ----------
  async open(): Promise<this> {
    await this.page.goto(urlFor(ExchangePage.URL_EXCHANGE));
    return this;
  }

  async openBuy(coin?: string): Promise<this> {
    const url = coin
      ? urlFor(`${ExchangePage.URL_BUY}/${coin}`)
      : urlFor(ExchangePage.URL_BUY);
    await this.page.goto(url);
    return this;
  }

  async openSell(coin?: string): Promise<this> {
    const url = coin
      ? urlFor(`${ExchangePage.URL_SELL}/${coin}`)
      : urlFor(ExchangePage.URL_SELL);
    await this.page.goto(url);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 20_000);
  }

  /** Wait until either the widget or the KYC gate is visible. */
  async waitForWidgetOrKyc(timeoutMs = 25_000): Promise<WidgetState> {
    // Race all three locators in one wait — Playwright resolves on the first match.
    const widget = this.saveButton.or(this.cryptoAmountInput);
    const anything = widget.or(this.kycGateButton);
    if (!(await this.isVisible(anything, timeoutMs))) {
      return 'neither';
    }
    if (await this.isVisible(widget, 500)) return 'widget';
    if (await this.isVisible(this.kycGateButton, 500)) return 'kyc';
    return 'neither';
  }

  // ---------- tabs ----------
  async hasBuyAndSellTabs(): Promise<boolean> {
    return (
      (await this.isVisible(this.buyTab, 10_000)) &&
      (await this.isVisible(this.sellTab, 5_000))
    );
  }

  async activeTabText(): Promise<string | null> {
    if (!(await this.isVisible(this.activeTab, 5_000))) return null;
    return ((await this.activeTab.innerText()) ?? '').trim();
  }

  async clickBuyTab(): Promise<void> {
    await this.buyTab.click();
  }

  async clickSellTab(): Promise<void> {
    await this.sellTab.click();
  }

  // ---------- coin list ----------
  coinCount(): Promise<number> {
    return this.coinListRows.count();
  }

  async searchCoin(query: string): Promise<boolean> {
    if (!(await this.isVisible(this.coinSearchInput, 5_000))) return false;
    await this.coinSearchInput.fill(query);
    return true;
  }

  // ---------- widget ----------
  isWidgetVisible(): Promise<boolean> {
    return this.isVisible(this.saveButton.or(this.cryptoAmountInput), 10_000);
  }

  /** Returns true if Save button is disabled, false if enabled, null on error. */
  async isSaveButtonDisabled(): Promise<boolean | null> {
    try {
      const btn = this.saveButton.first();
      const disabledAttr = await btn.getAttribute('disabled');
      const cls = (await btn.getAttribute('class')) ?? '';
      const ariaDisabled = await btn.getAttribute('aria-disabled');
      return disabledAttr !== null || cls.includes('disabled') || ariaDisabled === 'true';
    } catch {
      return null;
    }
  }

  async clickMin(): Promise<void> {
    await this.minButton.click();
  }

  async clickMax(): Promise<void> {
    await this.maxButton.click();
  }

  hasMinButton(): Promise<boolean> {
    return this.isVisible(this.minButton, 5_000);
  }

  hasMaxButton(): Promise<boolean> {
    return this.isVisible(this.maxButton, 5_000);
  }

  async cryptoAmountValue(): Promise<string | null> {
    try {
      return await this.cryptoAmountInput.first().inputValue();
    } catch {
      return null;
    }
  }

  async typeCryptoAmount(amount: string | number): Promise<void> {
    await this.cryptoAmountInput.fill(String(amount));
  }

  async clearCryptoAmount(): Promise<void> {
    try {
      await this.cryptoAmountInput.fill('');
    } catch {
      /* ignore */
    }
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /** Save becomes enabled once a fiat wallet is picked AND a crypto amount
   * is entered AND no in-flight conversion is loading.
   */
  async waitForSaveEnabled(timeoutMs = 20_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if ((await this.isSaveButtonDisabled()) === false) return true;
      await this.page.waitForTimeout(300);
    }
    return false;
  }

  // ---------- fiat dropdown interaction ----------
  async openFiatDropdown(timeoutMs = 10_000): Promise<void> {
    await this.fiatSelectorClick.click();
    await this.openDropdownOption.first().waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /** Read each fiat option's code (rendered as the <h5> in the option label). */
  async listFiatOptionCodes(): Promise<string[]> {
    const out: string[] = [];
    const c = await this.openDropdownOption.count();
    for (let i = 0; i < c; i++) {
      const opt = this.openDropdownOption.nth(i);
      if (!(await opt.isVisible().catch(() => false))) continue;
      // AppSelect option label structure: <h5>CODE</h5><p>balance</p>
      const head = opt.locator('h5');
      let txt = '';
      if ((await head.count()) > 0) {
        txt = ((await head.first().innerText().catch(() => '')) ?? '').trim();
      } else {
        txt = ((await opt.innerText().catch(() => '')) ?? '').split('\n')[0]!.trim();
      }
      if (txt) out.push(txt);
    }
    return out;
  }

  /** Open the fiat dropdown and click the first non-disabled option. */
  async selectFiatFirstOption(): Promise<boolean> {
    await this.openFiatDropdown();
    const c = await this.openDropdownOption.count();
    for (let i = 0; i < c; i++) {
      const opt = this.openDropdownOption.nth(i);
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        return true;
      }
    }
    return false;
  }

  /** Open the fiat dropdown and click the option whose label starts with `code`. */
  async selectFiatByCode(code: string): Promise<boolean> {
    await this.openFiatDropdown();
    const c = await this.openDropdownOption.count();
    for (let i = 0; i < c; i++) {
      const opt = this.openDropdownOption.nth(i);
      if (!(await opt.isVisible().catch(() => false))) continue;
      const head = opt.locator('h5');
      const headText =
        (await head.count()) > 0
          ? ((await head.first().innerText().catch(() => '')) ?? '').trim()
          : ((await opt.innerText().catch(() => '')) ?? '').trim();
      if (headText.toUpperCase().startsWith(code.toUpperCase())) {
        await opt.click();
        return true;
      }
    }
    return false;
  }

  async selectedFiatText(): Promise<string | null> {
    try {
      const sel = this.fiatDropdown.locator('.ant-select-selection-item');
      return ((await sel.first().innerText()) ?? '').trim();
    } catch {
      return null;
    }
  }

  // ---------- conversion / amount sync ----------
  /** After typing or clicking Min/Max, the fiat amount populates async via
   * debouncedCryptoFiatConverter. Poll until non-empty and non-zero.
   */
  async waitForFiatConversion(timeoutMs = 15_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const c = await this.fiatAmountDisplay.count();
      for (let i = 0; i < c; i++) {
        const el = this.fiatAmountDisplay.nth(i);
        const val = ((await el.inputValue().catch(() => '')) ||
          (await el.innerText().catch(() => '')) ||
          '').trim();
        if (val && !['0', '0.00', '0,00'].includes(val)) return true;
      }
      await this.page.waitForTimeout(300);
    }
    return false;
  }

  // ---------- alerts / errors ----------
  async getValidationError(timeoutMs = 5_000): Promise<string | null> {
    if (!(await this.isVisible(this.validationError, timeoutMs))) return null;
    return ((await this.validationError.first().innerText()) ?? '').trim();
  }

  async getTopAlert(timeoutMs = 5_000): Promise<string | null> {
    if (!(await this.isVisible(this.topAlert, timeoutMs))) return null;
    return ((await this.topAlert.first().innerText()) ?? '').trim();
  }
}

/** Buy/Sell summary screen at /exchange/{action}/:coin/summary/:isCrypto. */
export class ExchangeSummaryPage extends BasePage {
  static readonly URL_FRAGMENT = '/summary/';

  readonly summaryContainer: Locator = this.page.locator(".summary, [class*='summary']");
  readonly confirmButton: Locator = this.page.getByRole('button', { name: /Confirm/i });
  readonly errorAlert: Locator = this.page.locator('.alert-flex, .ant-alert-error');

  async isLoaded(): Promise<boolean> {
    return (
      this.page.url().includes(ExchangeSummaryPage.URL_FRAGMENT) &&
      (await this.isVisible(this.confirmButton, 20_000))
    );
  }

  async waitUntilLoaded(timeoutMs = 30_000): Promise<void> {
    await this.page.waitForURL(
      (u) => u.toString().includes(ExchangeSummaryPage.URL_FRAGMENT),
      { timeout: timeoutMs },
    );
    await this.confirmButton.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    if (!(await this.isVisible(this.errorAlert, 3_000))) return null;
    return ((await this.errorAlert.first().innerText()) ?? '').trim();
  }
}

/** Buy/Sell success screen at /exchange/{action}/:coin/success. */
export class ExchangeSuccessPage extends BasePage {
  static readonly URL_FRAGMENT = '/success';

  readonly againButton: Locator = this.page.getByRole('button', { name: /Again/i });
  readonly successContainer: Locator = this.page.locator(
    ".panel-card.buy-card, .panel-card.sell-card, [class*='success']",
  );

  isLoaded(): boolean {
    return this.page.url().includes(ExchangeSuccessPage.URL_FRAGMENT);
  }

  async waitUntilLoaded(timeoutMs = 60_000): Promise<void> {
    await this.page.waitForURL(
      (u) => u.toString().includes(ExchangeSuccessPage.URL_FRAGMENT),
      { timeout: timeoutMs },
    );
  }

  async clickAgain(): Promise<void> {
    await this.againButton.click();
  }

  isAgainVisible(): Promise<boolean> {
    return this.isVisible(this.againButton, 10_000);
  }
}
