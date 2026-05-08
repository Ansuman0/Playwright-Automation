import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Profile module. Source: src/core/profile/ */
export class ProfilePage extends BasePage {
  // Wait for the tab list inside main — confirms React has mounted the profile
  // page, not just the SPA shell. Avoids matching a hidden sidebar element.
  readonly layoutContainer: Locator = this.page.locator(
    "main [role='tablist'], main [class*='profile'], main",
  );
  readonly detailsLink: Locator = this.page.locator("a[href$='/profile/details']");
  readonly securityLink: Locator = this.page.locator("a[href$='/profile/security']");
  readonly addressesLink: Locator = this.page.locator("a[href$='/profile/addresses']");
  readonly kycLink: Locator = this.page.locator("a[href$='/profile/kyc']");
  readonly kybLink: Locator = this.page.locator("a[href$='/profile/kyb']");
  readonly feesLink: Locator = this.page.locator("a[href$='/profile/fees']");
  readonly membershipsLink: Locator = this.page.locator("a[href$='/profile/memberships']");

  async open(routePath: string = AuthRoutes.PROFILE): Promise<this> {
    await this.goto(routePath);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 30_000);
  }
}

/** Profile -> Security. Common form fields: change password, MFA toggle. */
export class SecurityPage extends BasePage {
  readonly oldPassword: Locator = this.page.locator("input[name='oldPassword']");
  readonly newPassword: Locator = this.page.locator("input[name='newPassword']");
  readonly confirmPassword: Locator = this.page.locator("input[name='confirmPassword']");
  readonly saveButton: Locator = this.page.getByRole('button', { name: /^(Save|Update)$/ });
  readonly mfaToggle: Locator = this.page.locator('.ant-switch');
}
