import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Transactions list. Source: src/core/transactions/index.jsx */
export class TransactionsPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='transaction']");
  readonly grid: Locator = this.page.locator(".k-grid, .ant-table, [class*='grid']");
  readonly exportButton: Locator = this.page.locator(
    "button:has-text('Export'), button:has-text('Download')",
  );
  readonly searchInput: Locator = this.page.locator("input[placeholder*='Search']");
  readonly dateFrom: Locator = this.page.locator("input[placeholder*='From']");
  readonly dateTo: Locator = this.page.locator("input[placeholder*='To']");

  async open(): Promise<this> {
    await this.goto(AuthRoutes.TRANSACTIONS);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }

  hasGrid(): Promise<boolean> {
    return this.isVisible(this.grid, 10_000);
  }
}
