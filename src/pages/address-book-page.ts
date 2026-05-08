import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Address book. Source: src/modules/addressBook/ */
export class AddressBookPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='address']");
  readonly fiatTab: Locator = this.page.locator("a[href*='/addressbook/fiat']");
  readonly cryptoTab: Locator = this.page.locator("a[href*='/addressbook/crypto']");
  readonly addButton: Locator = this.page.getByRole('button', { name: /Add/i });

  async open(): Promise<this> {
    await this.goto(AuthRoutes.ADDRESS_BOOK);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }
}
