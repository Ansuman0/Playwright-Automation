import { Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Auth0 password-reset page. Reached only by clicking the "Reset password"
 * link from the login page — the URL contains a dynamic ?state=...
 */
export class ForgotPasswordPage extends BasePage {
  static readonly URL_FRAGMENT = '/password-reset-start';

  readonly emailInput: Locator = this.page.locator(
    "#email, #username, input[name='email'], input[name='username']",
  );
  readonly submitButton: Locator = this.page.locator(
    "button[type='submit'][data-action-button-primary='true']",
  );
  readonly backLink: Locator = this.page.locator("a[href*='/u/login']");
  readonly successMessage: Locator = this.page.locator(
    ".ulp-success, .ulp-alert-success, [role='status']",
  );
  readonly anyError: Locator = this.page.locator(".ulp-error-info, .ulp-alert, [role='alert']");

  isDisplayed(): Promise<boolean> {
    return (async () => {
      if (!this.page.url().includes(ForgotPasswordPage.URL_FRAGMENT)) return false;
      return this.isVisible(this.emailInput, 10_000);
    })();
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  isSuccess(): Promise<boolean> {
    return this.isVisible(this.successMessage, 15_000);
  }

  async getErrorMessage(): Promise<string | null> {
    const c = await this.anyError.count();
    for (let i = 0; i < c; i++) {
      const el = this.anyError.nth(i);
      if (await el.isVisible().catch(() => false)) {
        const txt = (await el.innerText().catch(() => '')).trim();
        if (txt) return txt;
      }
    }
    return null;
  }
}
