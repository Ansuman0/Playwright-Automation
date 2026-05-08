import { test, expect } from '@playwright/test';
import { config } from '../src/utils/config';
import { LoginPage } from '../src/pages/login-page';
import { ForgotPasswordPage } from '../src/pages/forgot-password-page';

// Auth0's password-reset URL has a dynamic ?state=... so we always
// arrive there by clicking the Reset Password link from the login page.
async function navigateToReset(page: import('@playwright/test').Page): Promise<ForgotPasswordPage> {
  const login = new LoginPage(page);
  await login.open();
  await login.goToResetPassword();
  return new ForgotPasswordPage(page);
}

test('@regression reset-password page loads', async ({ page }) => {
  const reset = await navigateToReset(page);
  expect(await reset.isDisplayed(), 'Reset password page did not render').toBe(true);
  await expect(reset.submitButton).toBeVisible({ timeout: 10_000 });
});

test('@regression reset-password rejects invalid email format', async ({ page }) => {
  const reset = await navigateToReset(page);
  await reset.requestReset('not-a-real-email-format');

  // Auth0 should reject invalid format with an inline error and stay on
  // the same page (URL still contains /password-reset-start).
  const stayedOrErrored =
    (await reset.isVisible(reset.anyError, 10_000)) ||
    page.url().includes(ForgotPasswordPage.URL_FRAGMENT);
  expect(stayedOrErrored).toBe(true);
});

test.skip('@regression reset-password accepts valid email (sends real email)', async ({
  page,
}) => {
  const reset = await navigateToReset(page);
  await reset.requestReset(config.username);
  expect(await reset.isSuccess()).toBe(true);
});
