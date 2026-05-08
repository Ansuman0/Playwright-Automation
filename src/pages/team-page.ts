import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

/** Team management. Source: src/modules/team/ */
export class TeamPage extends BasePage {
  readonly layoutContainer: Locator = this.page.locator("main, [class*='team']");
  readonly inviteButton: Locator = this.page.locator(
    "a[href*='/settings/team/invite'], button:has-text('Invite')",
  );
  readonly memberRow: Locator = this.page.locator(".ant-table-row, [class*='member-row']");

  async open(): Promise<this> {
    await this.goto(AuthRoutes.SETTINGS_TEAM);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.layoutContainer, 15_000);
  }
}

/** Invite team member. Source: src/modules/team/Invite.jsx */
export class InviteMemberPage extends BasePage {
  readonly email: Locator = this.page.locator("input[name='email']");
  readonly firstName: Locator = this.page.locator("input[name='firstName']");
  readonly lastName: Locator = this.page.locator("input[name='lastName']");
  readonly roleSelect: Locator = this.page.locator("[name='role'], [id*='role']");
  readonly sendButton: Locator = this.page.getByRole('button', { name: /(Send|Invite)/i });
  readonly successToast: Locator = this.page.locator('.ant-message-success');

  async fill(email: string, firstName?: string, lastName?: string): Promise<void> {
    await this.email.fill(email);
    if (firstName) await this.firstName.fill(firstName);
    if (lastName) await this.lastName.fill(lastName);
  }

  async submit(): Promise<void> {
    await this.sendButton.click();
  }

  isSuccess(): Promise<boolean> {
    return this.isVisible(this.successToast, 15_000);
  }
}
