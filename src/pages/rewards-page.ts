import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Rewards module. Source: src/modules/rewards/ */
export class RewardsPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='reward']");
  readonly questsLink: Locator = this.page.locator("a[href$='/rewards/quests']");
  readonly trophiesLink: Locator = this.page.locator("a[href$='/rewards/trophies']");
  readonly mysteryBoxesLink: Locator = this.page.locator("a[href$='/rewards/mysteryboxes']");

  async open(): Promise<this> {
    await this.goto(AuthRoutes.REWARDS);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }
}
