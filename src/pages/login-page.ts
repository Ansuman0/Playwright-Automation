import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { config } from '../utils/config';
import { AuthRoutes } from '../utils/routes';

/**
 * Auth0 Universal Login.
 *
 * Unauthenticated users are redirected to:
 *     https://<tenant>.<AUTH0_DOMAIN>/u/login?state=<dynamic>
 *
 * The state param changes every redirect — never hard-code the Auth0 URL.
 * Always reach the form by hitting the app root and waiting for the bounce.
 * AUTH0_DOMAIN is read from the environment (default: auth0.com).
 */
export class LoginPage extends BasePage {
  private static readonly AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'auth0.com';
  static readonly AUTH0_LOGIN_FRAGMENT = `${LoginPage.AUTH0_DOMAIN}/u/login`;

  // Server-side errors land in different containers across Auth0 versions —
  // cover the union, then fall back to a known-phrase text search.
  private static readonly SERVER_ERROR_PHRASES = [
    'Incorrect',
    'incorrect',
    'Wrong',
    'wrong',
    'Invalid',
    'invalid',
    'blocked',
    'locked',
    'do not match',
    "doesn't match",
    'does not match',
  ];

  readonly usernameInput: Locator = this.page.locator('#username');
  readonly passwordInput: Locator = this.page.locator('#password');
  // Two submit buttons exist — first is a hidden helper. Target the visible primary.
  readonly submitButton: Locator = this.page.locator(
    "button[type='submit'][data-action-button-primary='true']",
  );
  readonly resetPasswordLink: Locator = this.page.locator("a[href*='/password-reset-start']");
  readonly signupLink: Locator = this.page.locator("a[href*='/u/signup']");

  // Client-side validation containers (hidden until invalid)
  readonly usernameRequiredErr: Locator = this.page.locator('#error-cs-username-required');
  readonly usernamePatternErr: Locator = this.page.locator('#error-cs-pattern-mismatch');
  readonly passwordRequiredErr: Locator = this.page.locator('#error-cs-password-required');

  readonly anyError: Locator = this.page.locator(
    [
      '.ulp-error-info',
      '.ulp-alert',
      '.ulp-server-error',
      '.auth0-global-message',
      '.auth0-error',
      "[role='alert']",
      "[aria-live='assertive']",
      "[id='alert']",
      "[id='alerts']",
      "[id^='alert-']",
      "[id^='error-element']",
    ].join(', '),
  );

  /** Navigate to a protected route so the SPA redirects unauthenticated users to Auth0. */
  async open(): Promise<this> {
    await this.page.goto(config.baseUrl.replace(/\/$/, '') + AuthRoutes.DASHBOARD);
    await this.waitUntilOnAuth0();
    await this.usernameInput.waitFor({ state: 'visible' });
    return this;
  }

  /**
   * Navigate to the app and detect auth state by waiting for real UI elements
   * rather than URL patterns. SPAs render at /dashboard before Auth0 SDK fires,
   * so URL checks race; element visibility is the reliable signal.
   *
   * Returns true  → Auth0 login form appeared (credentials needed).
   * Returns false → Dashboard menu appeared (already authenticated).
   */
  async openForSetup(timeout = 45_000): Promise<boolean> {
    await this.page.goto(config.baseUrl.replace(/\/$/, '') + AuthRoutes.DASHBOARD);

    const dashMenu = this.page.locator("[role='menu'], .ant-menu").first();
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      const poll = Math.min(2_000, deadline - Date.now());
      if (poll <= 0) break;

      // Check both states concurrently in each poll window.
      const [auth0Ready, dashReady] = await Promise.all([
        this.usernameInput.waitFor({ state: 'visible', timeout: poll }).then(() => true).catch(() => false),
        dashMenu.waitFor({ state: 'visible', timeout: poll }).then(() => true).catch(() => false),
      ]);

      if (auth0Ready) return true;   // Auth0 login form visible — needs credentials
      if (dashReady)  return false;  // Dashboard rendered — already authenticated
    }

    throw new Error(`Auth state undetermined after ${timeout}ms. URL: ${this.page.url()}`);
  }

  async waitUntilOnAuth0(timeout = 45_000): Promise<void> {
    await this.page.waitForURL((u) => u.toString().includes(LoginPage.AUTH0_LOGIN_FRAGMENT), {
      timeout,
      waitUntil: 'domcontentloaded',
    });
  }

  isOnAuth0(): boolean {
    return this.page.url().includes(LoginPage.AUTH0_LOGIN_FRAGMENT);
  }

  async login(username: string, password: string): Promise<this> {
    await this.usernameInput.fill(username);
    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(password, { delay: 30 });
    await this.submitButton.click();
    return this;
  }

  /** Click submit without filling — used for empty-credential validation tests. */
  async submitOnly(): Promise<this> {
    await this.submitButton.click();
    return this;
  }

  async goToResetPassword(): Promise<void> {
    await this.resetPasswordLink.click();
  }

  /** After successful login Auth0 redirects to /callback then /dashboard.
   * On dev environments this round-trip can take 5-10s, so default to 45s.
   */
  async waitForRedirectBack(timeout = 45_000): Promise<this> {
    await this.page.waitForURL((u) => !u.toString().includes(LoginPage.AUTH0_LOGIN_FRAGMENT), {
      timeout,
    });
    return this;
  }

  /** Return the first visible non-empty Auth0 error string, or null. */
  async getErrorMessage(timeoutMs = 10_000): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const containerCount = await this.anyError.count();
      for (let i = 0; i < containerCount; i++) {
        const el = this.anyError.nth(i);
        if (await el.isVisible().catch(() => false)) {
          const txt = (await el.innerText().catch(() => '')).trim();
          if (txt) return txt;
        }
      }
      for (const phrase of LoginPage.SERVER_ERROR_PHRASES) {
        const matches = this.page.locator(`text=${phrase}`);
        const c = await matches.count();
        for (let i = 0; i < c; i++) {
          const el = matches.nth(i);
          if (await el.isVisible().catch(() => false)) {
            const txt = (await el.innerText().catch(() => '')).trim();
            if (txt) return txt;
          }
        }
      }
      await this.page.waitForTimeout(300);
    }
    return null;
  }
}
