import { Locator, Page } from '@playwright/test';
import { urlFor } from '../utils/config';
import { getLogger, Logger } from '../utils/logger';

export class BasePage {
  protected readonly log: Logger;

  constructor(public readonly page: Page) {
    this.log = getLogger(this.constructor.name);
  }

  protected get defaultTimeout(): number {
    return 10_000;
  }

  /** Visibility check that resolves quickly without throwing on timeout. */
  async isVisible(locator: Locator, timeout = this.defaultTimeout): Promise<boolean> {
    try {
      await locator.first().waitFor({ state: 'visible', timeout });
      this.log.info(`isVisible ✓ [${locator}]`);
      return true;
    } catch {
      this.log.warn(`isVisible ✗ [${locator}] (timeout ${timeout}ms) — current URL: ${this.page.url()}`);
      return false;
    }
  }

  protected async urlContains(fragment: string, timeout = this.defaultTimeout): Promise<boolean> {
    try {
      await this.page.waitForURL((u) => u.toString().includes(fragment), { timeout });
      return true;
    } catch {
      this.log.warn(`urlContains ✗ "${fragment}" — current URL: ${this.page.url()}`);
      return false;
    }
  }

  protected async goto(routePath: string): Promise<void> {
    const target = urlFor(routePath);
    this.log.info(`goto → ${target}`);
    // SPAs fire the 'load' event late after every XHR settles. 'domcontentloaded'
    // is enough — locator auto-waiting handles the rest.
    await this.page.goto(target, { waitUntil: 'domcontentloaded' });
    this.log.info(`landed  → ${this.page.url()}`);
  }
}
