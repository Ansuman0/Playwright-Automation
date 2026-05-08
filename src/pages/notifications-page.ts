import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Notifications module. Source: src/modules/notifications/ */
export class NotificationsPage extends BasePage {
  // Scope to inside main so a hidden sidebar badge with a 'notification'
  // class doesn't match first and cause a spurious timeout.
  readonly layoutContainer: Locator = this.page.locator(
    "main [class*='notification'], main .ant-list-item, main",
  );
  readonly notificationItem: Locator = this.page.locator('.notification-item, .ant-list-item');
  readonly markAllRead: Locator = this.page.locator(
    "button:has-text('Mark all'), button:has-text('Read all')",
  );

  async open(): Promise<this> {
    await this.goto(AuthRoutes.NOTIFICATIONS);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 30_000);
  }
}
