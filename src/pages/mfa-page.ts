import { Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * OTP / 2FA verification at /mfa-verify.
 * Source: src/core/authentication/custom.auth/MFAVerification.jsx
 */
export class MfaPage extends BasePage {
  static readonly URL_FRAGMENT = '/mfa-verify';

  readonly otpInput: Locator = this.page.locator("input[name='otp']");
  readonly continueButton: Locator = this.page.getByRole('button', { name: /Continue/i });
  readonly cancelButton: Locator = this.page.getByRole('button', { name: /Cancel/i });
  readonly backupKeyCopy: Locator = this.page.locator("[aria-label*='copy' i], .copy-btn");
  readonly qrCode: Locator = this.page.locator("canvas, img[alt*='qr' i]");
  readonly errorAlert: Locator = this.page.locator('.alert-flex, .ant-alert-error');

  isDisplayed(): Promise<boolean> {
    return this.isVisible(this.otpInput, 10_000);
  }

  async submitOtp(code: string): Promise<void> {
    await this.otpInput.fill(code);
    await this.continueButton.click();
  }
}
