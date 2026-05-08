import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Cards module. Source: src/modules/cards/ */
export class CardsPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("[class*='cards'], .ant-tabs, main");
  readonly applyButton: Locator = this.page.locator(
    "a[href*='/cards/apply'], button:has-text('Apply')",
  );
  readonly bindCardButton: Locator = this.page.locator("a[href*='/cards/bindcard']");
  readonly myCardsTab: Locator = this.page.locator("a[href*='/cards/mycards']");

  async open(routePath: string = AuthRoutes.CARDS): Promise<this> {
    await this.goto(routePath);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }
}
