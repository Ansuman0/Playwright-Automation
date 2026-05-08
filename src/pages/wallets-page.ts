/**
 * Page objects for the Wallets module (Crypto + Fiat, Deposit + Withdraw).
 *
 * Source mapping (UI repo: /src/modules/wallets/):
 *   - Outlet / breadcrumbs:   WalletsOutlet.jsx
 *   - Routes:                 routesConfig.js
 *   - Crypto layout:          index.jsx + crypto/VaultsRightpannel.jsx
 *   - Crypto deposit:         crypto/CryptoDeposit.jsx (network buttons + QR + address)
 *   - Crypto withdraw:        crypto/CryptoWithdraw.jsx -> core/shared/WithdrawCryptoWidget.jsx
 *   - Crypto summary:         crypto/Summary.jsx
 *   - Fiat layout:            fiat/FiatLayout.jsx
 *   - Fiat deposit:           fiat/depositFiat/FiatCurrencyView.jsx
 *   - Fiat withdraw:          fiat/withdraw.components/FiatWithdraw.jsx -> core/shared/WithdrawFiatWidget.jsx
 *   - OTP verification:       core/verification.component/Verifications.jsx
 *
 * Defensive design: KYC gating, empty wallet list, missing networks, or no
 * payees configured all auto-skip with a clear reason instead of failing.
 */
import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

export type WalletsState = 'crypto' | 'fiat' | 'kyc' | 'empty' | 'neither';

export class WalletsPage extends BasePage {
  static readonly URL_WALLETS = AuthRoutes.WALLETS;
  static readonly URL_CRYPTO = AuthRoutes.WALLETS_CRYPTO;
  static readonly URL_FIAT = AuthRoutes.WALLETS_FIAT;

  // Layout shells — at least one of these is always present on /wallets/*.
  readonly layoutContainer: Locator = this.page.locator(
    "main, .ant-tabs, [class*='wallet']",
  );

  // Top-level Crypto / Fiat screen tabs (ScreenTabs.jsx).
  readonly cryptoScreenTab: Locator = this.page
    .locator(".custom-crypto-tabs div[role='tab']:has-text('Crypto')")
    .first();
  readonly fiatScreenTab: Locator = this.page
    .locator(".custom-crypto-tabs div[role='tab']:has-text('Fiat')")
    .first();

  // Direct nav-link tabs (links live in the WalletsOutlet config).
  readonly cryptoTab: Locator = this.page.locator("a[href*='/wallets/crypto']").first();
  readonly fiatTab: Locator = this.page.locator("a[href*='/wallets/fiat']").first();

  // Deposit / Withdraw tabs rendered by AppTabs (Ant Design Tabs).
  readonly depositTab: Locator = this.page
    .locator("div[role='tab']:has-text('Deposit')")
    .first();
  readonly withdrawTab: Locator = this.page
    .locator("div[role='tab']:has-text('Withdraw')")
    .first();
  readonly activeTab: Locator = this.page
    .locator('.ant-tabs-tab.ant-tabs-tab-active')
    .first();

  // Vault / coin list on the left panel.
  readonly coinListRows: Locator = this.page.locator(
    ".vaults-list [class*='listitem'], .vaults-list [class*='list-item'], .vaults-list .ant-list-item",
  );
  readonly walletAccordion: Locator = this.page.locator('.vault-accordion');

  // ---- Crypto deposit (CryptoDeposit.jsx) ----
  readonly networkChips: Locator = this.page.locator('.currency-active, .currency-box');
  readonly activeNetworkChip: Locator = this.page.locator('.currency-active');
  readonly depositAddressTitle: Locator = this.page.locator(
    "h4:has-text('Address'), h4:has-text('address')",
  );
  readonly qrCode: Locator = this.page.locator('.qr-image, svg.qr-image');
  readonly addressCopyBlock: Locator = this.page.locator('.copyadress');
  readonly shareSection: Locator = this.page.locator('.smm-icons');

  // ---- Crypto withdraw (WithdrawCryptoWidget.jsx) ----
  readonly amountInput: Locator = this.page.locator(
    "input[placeholder*='amount' i], input[name='amount'], .pay-inform input.custom-input-field",
  );
  readonly currencyDropdown: Locator = this.page.locator(
    ".pay-inform .ant-select:has(input[id*='currency'])",
  );
  readonly networkDropdown: Locator = this.page.locator(
    ".pay-inform .ant-select:has(input[id*='networkName']), .withdraw-network .ant-select",
  );
  readonly minButton: Locator = this.page
    .locator(".pay-inform button:has-text('Min')")
    .first();
  readonly maxButton: Locator = this.page
    .locator(".pay-inform button:has-text('Max')")
    .first();
  readonly continueButton: Locator = this.page
    .locator(".pay-inform button.ant-btn-primary, button:has-text('Continue')")
    .first();
  readonly validationError: Locator = this.page.locator('.ant-form-item-explain-error');
  readonly topAlert: Locator = this.page.locator(
    '.alert-flex, .ant-alert-message, .ant-alert-description',
  );

  // KYC gate (ActionControlKyc) — same matcher used in the Exchange page.
  readonly kycGateButton: Locator = this.page.locator(
    "button:has-text('KYC'), button:has-text('KYB'), button:has-text('Verify'), button:has-text('Complete')",
  );

  // Empty-state placeholder (AppEmpty variant="wallets").
  readonly emptyState: Locator = this.page.locator('.nodata-content, .ant-empty');

  // Payees (Payees.jsx renders inside the withdraw widget when shouldDisplayPayees=true).
  readonly addPayeeButton: Locator = this.page.locator(
    "button:has-text('Add Payee'), button:has-text('Add Address')",
  );
  readonly payeeRows: Locator = this.page.locator(
    "[class*='payee']:not([class*='no']), .payee-list .ant-list-item",
  );

  // ---- Summary / verifications ----
  readonly summaryHeading: Locator = this.page.locator(
    ".summary-panel h2:has-text('Summary'), h2:has-text('Summary')",
  );
  readonly summaryAmountRow: Locator = this.page.locator(
    ".summary-list-item:has-text('Amount')",
  );
  readonly summaryNetworkRow: Locator = this.page.locator(
    ".summary-list-item:has-text('Network')",
  );
  readonly phoneOtpInput: Locator = this.page
    .locator("input[id*='phoneCode'], #phoneCode")
    .first();
  readonly emailOtpInput: Locator = this.page
    .locator("input[id*='emailCode'], #emailCode")
    .first();
  readonly getCodeButton: Locator = this.page
    .locator("button:has-text('Get Code'), button:has-text('Get code')")
    .first();
  readonly verifiedBadge: Locator = this.page.locator(
    ".verifybg, button:has-text('Verified')",
  );
  readonly summaryWithdrawButton: Locator = this.page
    .locator(".summary-panel button.ant-btn-primary, .summery-panelcard button.ant-btn-primary")
    .first();

  // ---- navigation ----
  async open(): Promise<this> {
    await this.goto(WalletsPage.URL_WALLETS);
    return this;
  }

  async openCrypto(): Promise<this> {
    await this.goto(WalletsPage.URL_CRYPTO);
    return this;
  }

  async openFiat(): Promise<this> {
    await this.goto(WalletsPage.URL_FIAT);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }

  /** Resolves once any wallets surface — crypto, fiat, KYC gate, or empty state — is visible. */
  async waitForWalletsState(timeoutMs = 25_000): Promise<WalletsState> {
    const anything = this.layoutContainer
      .or(this.kycGateButton)
      .or(this.emptyState);
    if (!(await this.isVisible(anything, timeoutMs))) return 'neither';

    if (await this.isVisible(this.kycGateButton, 500)) return 'kyc';
    if (this.page.url().includes('/wallets/crypto')) return 'crypto';
    if (this.page.url().includes('/wallets/fiat')) return 'fiat';
    if (await this.isVisible(this.emptyState, 500)) return 'empty';
    return 'neither';
  }

  // ---- tabs ----
  async clickCryptoTab(): Promise<void> {
    await this.cryptoScreenTab.click();
  }

  async clickFiatTab(): Promise<void> {
    await this.fiatScreenTab.click();
  }

  async clickDeposit(): Promise<void> {
    await this.depositTab.click();
  }

  async clickWithdraw(): Promise<void> {
    await this.withdrawTab.click();
  }

  async activeTabText(): Promise<string | null> {
    if (!(await this.isVisible(this.activeTab, 5_000))) return null;
    return ((await this.activeTab.innerText()) ?? '').trim();
  }

  async hasDepositAndWithdrawTabs(): Promise<boolean> {
    return (
      (await this.isVisible(this.depositTab, 10_000)) &&
      (await this.isVisible(this.withdrawTab, 5_000))
    );
  }

  // ---- crypto deposit ----
  isDepositReady(): Promise<boolean> {
    return this.isVisible(this.networkChips.first(), 15_000);
  }

  hasQrCode(): Promise<boolean> {
    return this.isVisible(this.qrCode, 8_000);
  }

  async getDepositAddress(): Promise<string | null> {
    if (!(await this.isVisible(this.addressCopyBlock, 5_000))) return null;
    return ((await this.addressCopyBlock.first().innerText()) ?? '').trim();
  }

  async networkCount(): Promise<number> {
    return this.networkChips.count();
  }

  // ---- crypto withdraw widget ----
  isWithdrawWidgetVisible(): Promise<boolean> {
    return this.isVisible(this.amountInput.or(this.currencyDropdown), 10_000);
  }

  async typeAmount(amount: string | number): Promise<void> {
    await this.amountInput.first().fill(String(amount));
  }

  async clearAmount(): Promise<void> {
    try {
      await this.amountInput.first().fill('');
    } catch {
      /* ignore */
    }
  }

  async amountValue(): Promise<string | null> {
    try {
      return await this.amountInput.first().inputValue();
    } catch {
      return null;
    }
  }

  hasMinButton(): Promise<boolean> {
    return this.isVisible(this.minButton, 5_000);
  }

  hasMaxButton(): Promise<boolean> {
    return this.isVisible(this.maxButton, 5_000);
  }

  async clickMin(): Promise<void> {
    await this.minButton.click();
  }

  async clickMax(): Promise<void> {
    await this.maxButton.click();
  }

  async isContinueDisabled(): Promise<boolean | null> {
    try {
      const btn = this.continueButton;
      const disabled = await btn.getAttribute('disabled');
      const cls = (await btn.getAttribute('class')) ?? '';
      const aria = await btn.getAttribute('aria-disabled');
      return disabled !== null || cls.includes('disabled') || aria === 'true';
    } catch {
      return null;
    }
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async getValidationError(timeoutMs = 5_000): Promise<string | null> {
    if (!(await this.isVisible(this.validationError, timeoutMs))) return null;
    return ((await this.validationError.first().innerText()) ?? '').trim();
  }

  async getTopAlert(timeoutMs = 5_000): Promise<string | null> {
    if (!(await this.isVisible(this.topAlert, timeoutMs))) return null;
    return ((await this.topAlert.first().innerText()) ?? '').trim();
  }
}

/** Crypto / Fiat withdraw summary screen at /wallets/{type}/withdraw/.../summary. */
export class WithdrawSummaryPage extends BasePage {
  static readonly URL_FRAGMENT = '/summary';

  readonly summaryContainer: Locator = this.page.locator(
    '.summary-panel, .summery-panelcard, .summary',
  );
  readonly summaryHeading: Locator = this.page.locator(
    "h2:has-text('Summary')",
  );
  readonly amountRow: Locator = this.page.locator(
    ".summary-list-item:has-text('Amount')",
  );
  readonly feeRow: Locator = this.page.locator(".summary-list-item:has-text('Fee')");
  readonly addressRow: Locator = this.page.locator(
    ".summary-list-item:has-text('Address')",
  );

  readonly phoneOtpInput: Locator = this.page
    .locator("input[id*='phoneCode'], #phoneCode")
    .first();
  readonly emailOtpInput: Locator = this.page
    .locator("input[id*='emailCode'], #emailCode")
    .first();
  readonly getCodeButtons: Locator = this.page.locator(
    "button:has-text('Get Code'), button:has-text('Get code'), button:has-text('Resend Code')",
  );
  readonly clickHereToVerify: Locator = this.page.locator(
    "button:has-text('Click here to verify')",
  );
  readonly verifiedBadge: Locator = this.page.locator(
    ".verifybg, h4:has-text('Verified')",
  );
  readonly withdrawButton: Locator = this.page
    .locator(".summary-panel button.ant-btn-primary, .summery-panelcard button.ant-btn-primary")
    .first();
  readonly errorAlert: Locator = this.page.locator(
    '.alert-flex, .ant-alert-error, .ant-alert-description',
  );

  isOnSummaryUrl(): boolean {
    return this.page.url().includes(WithdrawSummaryPage.URL_FRAGMENT);
  }

  async waitUntilLoaded(timeoutMs = 30_000): Promise<void> {
    await this.page.waitForURL(
      (u) => u.toString().includes(WithdrawSummaryPage.URL_FRAGMENT),
      { timeout: timeoutMs },
    );
    await this.summaryHeading.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  hasOtpInputs(): Promise<boolean> {
    return this.isVisible(this.phoneOtpInput.or(this.emailOtpInput), 5_000);
  }

  /** Click every visible Get/Resend Code button so OTP inputs become enabled. */
  async requestAllOtpCodes(): Promise<number> {
    let clicked = 0;
    const count = await this.getCodeButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = this.getCodeButtons.nth(i);
      if (!(await btn.isVisible().catch(() => false))) continue;
      const disabled = await btn.getAttribute('disabled');
      if (disabled !== null) continue;
      await btn.click().catch(() => undefined);
      clicked += 1;
    }
    return clicked;
  }

  /** Type the same 6-digit OTP into every visible OTP input. */
  async fillOtps(code: string): Promise<number> {
    let filled = 0;
    if (await this.isVisible(this.phoneOtpInput, 2_000)) {
      await this.phoneOtpInput.fill(code);
      filled += 1;
    }
    if (await this.isVisible(this.emailOtpInput, 2_000)) {
      await this.emailOtpInput.fill(code);
      filled += 1;
    }
    return filled;
  }

  async getErrorMessage(timeoutMs = 3_000): Promise<string | null> {
    if (!(await this.isVisible(this.errorAlert, timeoutMs))) return null;
    return ((await this.errorAlert.first().innerText()) ?? '').trim();
  }

  async isWithdrawDisabled(): Promise<boolean | null> {
    try {
      const btn = this.withdrawButton;
      const disabled = await btn.getAttribute('disabled');
      const cls = (await btn.getAttribute('class')) ?? '';
      return disabled !== null || cls.includes('disabled');
    } catch {
      return null;
    }
  }

  async clickWithdraw(): Promise<void> {
    await this.withdrawButton.click();
  }
}

/** Crypto / Fiat withdraw success screen. */
export class WithdrawSuccessPage extends BasePage {
  static readonly URL_FRAGMENT = '/success';

  readonly successContainer: Locator = this.page.locator(
    "[class*='success'], .panel-card.buy-card, .panel-card",
  );

  isLoaded(): boolean {
    return this.page.url().includes(WithdrawSuccessPage.URL_FRAGMENT);
  }

  async waitUntilLoaded(timeoutMs = 60_000): Promise<void> {
    await this.page.waitForURL(
      (u) => u.toString().includes(WithdrawSuccessPage.URL_FRAGMENT),
      { timeout: timeoutMs },
    );
  }
}
