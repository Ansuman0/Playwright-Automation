import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Payments root. Source: src/modules/payments/index.jsx */
export class PaymentsPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='payment']");
  readonly payinsLink: Locator = this.page.locator("a[href*='/payments/payins']");
  readonly payoutsLink: Locator = this.page.locator("a[href*='/payments/payouts']");
  readonly batchPayoutsLink: Locator = this.page.locator("a[href*='/payments/batchpayouts']");
  readonly vaultsLink: Locator = this.page.locator("a[href*='/payments/vaults']");

  async open(): Promise<this> {
    await this.goto(AuthRoutes.PAYMENTS);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }
}

/**
 * Fiat payout form. Source: src/modules/payments/payouts/fiat.jsx
 * Fields are React-Hook-driven; wait for them to be enabled before typing.
 */
export class FiatPayoutPage extends BasePage {
  readonly merchantSelect: Locator = this.page.locator(
    "[id*='merchantId'], [name='merchantId']",
  );
  readonly currencySelect: Locator = this.page.locator(
    "[id*='fiatCurrency'], [id*='currency'], [name='fiatCurrency']",
  );
  readonly networkSelect: Locator = this.page.locator("[id*='network'], [name='network']");
  readonly payeeSelect: Locator = this.page.locator(
    "[id*='selectedPayee'], [name='selectedPayee']",
  );
  readonly amountInput: Locator = this.page.locator("input[name='amount']");
  readonly docUpload: Locator = this.page.locator("input[type='file']");

  readonly nextButton: Locator = this.page.getByRole('button', { name: /^(Next|Continue)$/ });
  readonly confirmButton: Locator = this.page.getByRole('button', { name: /^(Confirm|Send)$/ });
  readonly successToast: Locator = this.page.locator(
    '.ant-message-success, .ant-notification-notice-success',
  );
  readonly errorAlert: Locator = this.page.locator('.alert-flex, .ant-alert-error');

  async open(): Promise<this> {
    await this.goto(AuthRoutes.PAYMENTS_PAYOUTS);
    return this;
  }

  async fillAmount(amount: string | number): Promise<void> {
    await this.amountInput.fill(String(amount));
  }

  async submit(): Promise<void> {
    await this.nextButton.click();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  isSuccess(): Promise<boolean> {
    return this.isVisible(this.successToast, 20_000);
  }

  isAmountVisible(timeoutMs = 15_000): Promise<boolean> {
    return this.isVisible(this.amountInput, timeoutMs);
  }
}
