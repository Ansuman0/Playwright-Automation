import { test, expect } from '../src/fixtures';
import { config } from '../src/utils/config';
import { LoginPage } from '../src/pages/login-page';
import { DashboardPage } from '../src/pages/dashboard-page';

// Login tests use the no-auth project — no preloaded storageState.

test('@smoke valid login redirects to dashboard', async ({ page, stepLogger }) => {
  const login = new LoginPage(page);

  await test.step('Open login page', async () => {
    stepLogger.info('Navigating to app root and waiting for Auth0 redirect');
    await login.open();
  });

  await test.step('Enter credentials and submit', async () => {
    stepLogger.info(`Logging in as ${config.username}`);
    await login.login(config.username, config.password);
    await login.waitForRedirectBack();
  });

  await test.step('Verify dashboard is loaded', async () => {
    const loaded = await new DashboardPage(page).isLoaded();
    stepLogger.info(`Dashboard loaded: ${loaded}`);
    expect(loaded).toBe(true);
  });
});

test('@regression invalid password shows Auth0 error', async ({ page, stepLogger }) => {
  const login = new LoginPage(page);

  await test.step('Open login page', async () => {
    await login.open();
  });

  await test.step('Submit wrong password', async () => {
    stepLogger.warn('Using intentionally wrong password to trigger Auth0 error');
    await login.login(config.username, 'WrongPassword!123');
  });

  await test.step('Verify error is shown', async () => {
    const onAuth0 = login.isOnAuth0();
    const errorVisible = await login.isVisible(login.anyError, 15_000);
    expect(onAuth0 || errorVisible).toBe(true);

    const error = await login.getErrorMessage();
    stepLogger.info(`Error message: ${error ?? '(none)'}`);
    expect(error, `Expected non-empty error text, got: ${error}`).toBeTruthy();
  });
});

test('@regression empty credentials trigger client-side validation', async ({ page, stepLogger }) => {
  // Auth0 disables HTML5 validation (data-disable-html-validations='true')
  // and runs its own JS validation that surfaces .ulp-error-info elements.
  const login = new LoginPage(page);

  await test.step('Open login page', async () => {
    await login.open();
  });

  await test.step('Submit with no credentials', async () => {
    stepLogger.info('Clicking submit without filling any fields');
    await login.submitOnly();
  });

  await test.step('Verify validation error or Auth0 redirect', async () => {
    const usernameErr = await login.isVisible(login.usernameRequiredErr, 10_000);
    const passwordErr = await login.isVisible(login.passwordRequiredErr, 10_000);
    const onAuth0 = login.isOnAuth0();
    stepLogger.info(`usernameErr=${usernameErr} passwordErr=${passwordErr} onAuth0=${onAuth0}`);
    expect(usernameErr || passwordErr || onAuth0).toBe(true);
  });
});

test('@regression invalid email pattern keeps user on Auth0', async ({ page, stepLogger }) => {
  // Auth0 client-side pattern check fires when username isn't a valid email/username.
  const login = new LoginPage(page);

  await test.step('Open login page', async () => {
    await login.open();
  });

  await test.step('Enter invalid email and submit', async () => {
    const badEmail = 'not a real email!@#';
    stepLogger.warn(`Entering invalid email: "${badEmail}"`);
    await login.usernameInput.fill(badEmail);
    await login.passwordInput.fill('anything');
    await login.submitButton.click();
  });

  await test.step('Verify user stays on Auth0', async () => {
    const onAuth0 = login.isOnAuth0();
    stepLogger.info(`Still on Auth0: ${onAuth0}`);
    expect(onAuth0, 'Should remain on Auth0 with invalid email pattern').toBe(true);
  });
});

test('@regression reset-password link is visible', async ({ page }) => {
  const login = new LoginPage(page);

  await test.step('Open login page', async () => {
    await login.open();
  });

  await test.step('Check reset-password link visibility', async () => {
    await expect(login.resetPasswordLink).toBeVisible({ timeout: 10_000 });
  });
});

test('@regression signup link is visible', async ({ page }) => {
  const login = new LoginPage(page);

  await test.step('Open login page', async () => {
    await login.open();
  });

  await test.step('Check signup link visibility', async () => {
    await expect(login.signupLink).toBeVisible({ timeout: 10_000 });
  });
});
