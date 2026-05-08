import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Banks module. Source: src/modules/banks/ */
export class BanksPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='bank']");
  readonly createAccountButton: Locator = this.page.locator(
    "a[href*='/banks/account/create'], button:has-text('Create')",
  );
  readonly depositLink: Locator = this.page.locator("a[href*='/banks/deposit']");
  readonly withdrawLink: Locator = this.page.locator("a[href*='/banks/withdraw']");

  async open(): Promise<this> {
    await this.goto(AuthRoutes.BANKS);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }
}

/**
 * KYC/KYB wizard at /banks/account/create/{productId}/{type}.
 * Form fields are config-driven (Requirements component) — selectors below
 * cover the most common labels. Inspect the live form for exact names.
 */
export class BanksApplyStepsPage extends BasePage {
  readonly firstName: Locator = this.page.locator(
    "input[name='firstName'], input[id*='firstName']",
  );
  readonly lastName: Locator = this.page.locator("input[name='lastName'], input[id*='lastName']");
  readonly email: Locator = this.page.locator("input[name='email']");
  readonly phone: Locator = this.page.locator("input[name='phoneNo']");
  readonly dob: Locator = this.page.locator(
    "input[name='dateOfBirth'], input[placeholder*='Date']",
  );

  readonly nextButton: Locator = this.page.getByRole('button', { name: /^(Next|Continue)$/ });
  readonly submitButton: Locator = this.page.getByRole('button', { name: /^Submit$/ });
  readonly errorAlert: Locator = this.page.locator('.alert-flex, .ant-alert-error');
}
