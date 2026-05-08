import { Locator } from '@playwright/test';
import { BasePage } from './base-page';

/** Global header / sidebar nav. Source: src/core/layout/header.jsx */
export class HeaderPage extends BasePage {
  // Sidebar user section — some builds show a profile photo, others just user-name text.
  readonly profilePhoto: Locator = this.page.locator(
    "img[alt*='profile photo' i], [role='complementary'] p, aside p",
  ).first();
  readonly manageAccountLink: Locator = this.page
    .locator("a[href='/profile']:has-text('Manage Account')")
    .first();
  // Mobile-only profile-dropdown wrapper (.profile-dropdown is `lg:hidden`).
  readonly profileDropdownMobile: Locator = this.page.locator('.profile-dropdown');
  // header.jsx applies the .logout-btn class but Tailwind utility ordering can
  // break direct class matching; the role + accessible-name pair is bulletproof.
  readonly logoutButton: Locator = this.page.getByRole('button', { name: 'Logout' });

  readonly navDashboard: Locator = this.page.locator("a[href$='/dashboard']");
  readonly navWallets: Locator = this.page.locator("a[href$='/wallets'], a[href*='/wallets']");
  readonly navCards: Locator = this.page.locator("a[href$='/cards'], a[href*='/cards']");
  readonly navExchange: Locator = this.page.locator("a[href$='/exchange'], a[href*='/exchange']");
  readonly navBanks: Locator = this.page.locator("a[href$='/banks'], a[href*='/banks']");
  readonly navPayments: Locator = this.page.locator("a[href$='/payments'], a[href*='/payments']");
  readonly navTransactions: Locator = this.page.locator("a[href$='/transactions']");
  readonly navPayees: Locator = this.page.locator("a[href$='/payees'], a[href*='/payees']");
  readonly navNotifications: Locator = this.page.locator("a[href$='/notifications']");
  readonly navRewards: Locator = this.page.locator("a[href$='/rewards'], a[href*='/rewards']");

  /** Logout sits at the bottom of a scrollable sidebar — scroll it into view first. */
  async clickLogout(): Promise<void> {
    await this.logoutButton.scrollIntoViewIfNeeded();
    await this.logoutButton.click();
  }

  async navClick(hrefSubstring: string): Promise<void> {
    this.log.info(`navClick: clicking link href*="${hrefSubstring}" — current URL: ${this.page.url()}`);
    await this.page.locator(`a[href*='${hrefSubstring}']`).first().click();
    this.log.info(`navClick: post-click URL: ${this.page.url()}`);
  }

  async navLinkVisible(hrefSubstring: string): Promise<boolean> {
    const visible = await this.isVisible(
      this.page.locator(`a[href*='${hrefSubstring}']`).first(),
      5_000,
    );
    this.log.info(`navLinkVisible "${hrefSubstring}" → ${visible}`);
    return visible;
  }
}
