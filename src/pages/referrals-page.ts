import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Referrals module. Source: src/modules/referrals/ */
export class ReferralsPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='referral']");
  readonly referralCode: Locator = this.page.locator(
    "[class*='referral-code'], [class*='code-display']",
  );
  readonly copyButton: Locator = this.page.getByRole('button', { name: /Copy/i });
  readonly shareButton: Locator = this.page.getByRole('button', { name: /Share/i });

  async open(): Promise<this> {
    await this.goto(AuthRoutes.REFERRALS);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }
}
