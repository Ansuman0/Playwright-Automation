import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { config } from '../utils/config';

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
  static readonly AUTH0_LOGIN_FRAGMENT = `${config.auth0Domain}/u/login`;

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

  /** Hit the app root; the SPA bounces unauth'd users to Auth0. */
  async open(): Promise<this> {
    await this.page.goto(config.baseUrl);
    await this.waitUntilOnAuth0();
    await this.usernameInput.waitFor({ state: 'visible' });
    return this;
  }

  async waitUntilOnAuth0(timeout = 45_000): Promise<void> {
    await this.page.waitForURL(
      (u) => {
        const url = u.toString();
        // Match the full fragment when AUTH0_DOMAIN is explicitly configured,
        // otherwise fall back to matching just the /u/login path so the check
        // works with both standard auth0.com subdomains and custom domains.
        if (config.auth0Domain && config.auth0Domain !== 'auth0.com') {
          return url.includes(LoginPage.AUTH0_LOGIN_FRAGMENT);
        }
        return url.includes('/u/login');
      },
      { timeout, waitUntil: 'domcontentloaded' },
    );
  }

  isOnAuth0(): boolean {
    const url = this.page.url();
    if (config.auth0Domain && config.auth0Domain !== 'auth0.com') {
      return url.includes(LoginPage.AUTH0_LOGIN_FRAGMENT);
    }
    return url.includes('/u/login');
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
