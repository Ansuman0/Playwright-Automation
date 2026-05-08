import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/**
 * Main dashboard at /dashboard.
 * Source: src/core/dashboard/Dashboard.jsx (or KyropayDashboard if VITE_APP_IS_MEMBER_DASHBOARD=true).
 *
 * The dashboard has no single root class. Detect it via the surrounding shell
 * (left-rail menu + sidebar avatar) which the layout always renders.
 */
export class DashboardPage extends BasePage {
  static readonly URL_FRAGMENT = AuthRoutes.DASHBOARD;

  // Sidebar user section — some builds render a profile photo img; others show
  // only user-name text in a <p>. Match whichever appears first in the sidebar.
  readonly profilePhoto: Locator = this.page.locator(
    "img[alt*='profile photo' i], [role='complementary'] p, aside p",
  ).first();
  // "Manage Account" link → /profile. Two copies render (desktop + mobile shells).
  readonly manageAccountLink: Locator = this.page
    .locator("a[href='/profile']:has-text('Manage Account')")
    .first();
  // Ant menu in the left rail.
  readonly appMenu: Locator = this.page.locator("[role='menu'], .ant-menu");
  // Logout button (visible on desktop sidebar).
  readonly logoutButton: Locator = this.page.locator('button.logout-btn');

  async open(): Promise<this> {
    this.log.info('Opening dashboard');
    await this.goto(DashboardPage.URL_FRAGMENT);
    this.log.info(`Post-navigate URL: ${this.page.url()}`);
    return this;
  }

  /** Loaded once the left-rail menu has rendered — that means the AppLayout shell is mounted. */
  async isLoaded(): Promise<boolean> {
    this.log.info('Waiting for appMenu to confirm dashboard loaded');
    const loaded = await this.isVisible(this.appMenu, 20_000);
    this.log.info(`Dashboard isLoaded → ${loaded}  (URL: ${this.page.url()})`);
    return loaded;
  }

  async goTo(routePath: string): Promise<void> {
    await this.goto(routePath);
  }
}
