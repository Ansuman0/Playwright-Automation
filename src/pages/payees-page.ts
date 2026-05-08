import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Payees list. Source: src/modules/payees/index.jsx */
export class PayeesPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='payee']");
  readonly addPayeeButton: Locator = this.page.locator(
    "button:has-text('Add Payee'), button:has-text('New Payee'), a[href*='/payees']:has-text('Add')",
  );
  readonly fiatTab: Locator = this.page.locator("a[href*='/payees/fiat']");
  readonly cryptoTab: Locator = this.page.locator("a[href*='/payees/crypto']");
  readonly payeeRow: Locator = this.page.locator(".ant-table-row, [class*='payee-row']");

  async open(): Promise<this> {
    this.log.info('Opening payees page');
    await this.goto(AuthRoutes.PAYEES);
    this.log.info(`Post-navigate URL: ${this.page.url()}`);
    return this;
  }

  async openFiat(): Promise<this> {
    this.log.info('Opening payees/fiat page');
    await this.goto(AuthRoutes.PAYEES_FIAT);
    this.log.info(`Post-navigate URL: ${this.page.url()}`);
    return this;
  }

  async openCrypto(): Promise<this> {
    this.log.info('Opening payees/crypto page');
    await this.goto(AuthRoutes.PAYEES_CRYPTO);
    this.log.info(`Post-navigate URL: ${this.page.url()}`);
    return this;
  }

  async isLoaded(): Promise<boolean> {
    this.log.info('Checking payees layout container visibility');
    const loaded = await this.isVisible(this.layoutContainer, 15_000);
    this.log.info(`PayeesPage isLoaded → ${loaded}  (URL: ${this.page.url()})`);
    return loaded;
  }
}

/**
 * Add fiat payee form. Source: src/modules/payees/fiat/Form.jsx
 * Most fields are dynamic (loaded from bank lookup API). Below covers
 * the consistent ones; extend after inspecting the live form for the
 * selected destination country.
 */
export class FiatPayeeFormPage extends BasePage {
  readonly favouriteName: Locator = this.page.locator(
    "input[name='favouriteName'], input[id*='favouriteName']",
  );
  readonly bankLookup: Locator = this.page.locator("[id*='bankLookUp'], [name='bankLookUp']");
  readonly accountNumber: Locator = this.page.locator(
    "input[name='bankAccountNumber'], input[id*='accountNumber']",
  );
  readonly addressTypeRadio: Locator = this.page.locator("input[name='addressTypeDetails']");

  readonly saveButton: Locator = this.page.getByRole('button', {
    name: /^(Save Payee|Save|Next)$/,
  });
  readonly errorAlert: Locator = this.page.locator(
    '.alert-flex, .ant-alert-error, .ant-alert-warning',
  );
  readonly successToast: Locator = this.page.locator(
    '.ant-message-success, .ant-notification-notice-success',
  );

  async fillBasic(favouriteName: string): Promise<void> {
    await this.favouriteName.fill(favouriteName);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  isSuccess(): Promise<boolean> {
    return this.isVisible(this.successToast, 15_000);
  }

  isFavouriteNameVisible(): Promise<boolean> {
    return this.isVisible(this.favouriteName, 10_000);
  }

  isErrorVisible(): Promise<boolean> {
    return this.isVisible(this.errorAlert, 5_000);
  }
}
