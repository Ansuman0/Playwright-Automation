/**
 * Per-module smoke tests — one assertion per module that the page renders.
 * Designed to be cheap and parallel-friendly. For deeper flow tests
 * (filling forms, executing transfers), extend the matching page object
 * and add a dedicated <module>.spec.ts file.
 */
import { test, expect } from '@playwright/test';
import { AddressBookPage } from '../src/pages/address-book-page';
import { BanksPage } from '../src/pages/banks-page';
import { CardsPage } from '../src/pages/cards-page';
import { ExchangePage } from '../src/pages/exchange-page';
import { NotificationsPage } from '../src/pages/notifications-page';
import { PaymentsPage } from '../src/pages/payments-page';
import { ProfilePage } from '../src/pages/profile-page';
import { ReferralsPage } from '../src/pages/referrals-page';
import { RewardsPage } from '../src/pages/rewards-page';
import { TeamPage } from '../src/pages/team-page';
import { TransactionsPage } from '../src/pages/transactions-page';
import { WalletsPage } from '../src/pages/wallets-page';

test('@smoke cards module loads', async ({ page }) => {
  expect(await (await new CardsPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke wallets crypto module loads', async ({ page }) => {
  expect(await (await new WalletsPage(page).openCrypto()).isLoaded()).toBe(true);
});

test('@smoke wallets fiat module loads', async ({ page }) => {
  expect(await (await new WalletsPage(page).openFiat()).isLoaded()).toBe(true);
});

test('@smoke banks module loads', async ({ page }) => {
  expect(await (await new BanksPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke payments module loads', async ({ page }) => {
  expect(await (await new PaymentsPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke exchange module loads', async ({ page }) => {
  expect(await (await new ExchangePage(page).open()).isLoaded()).toBe(true);
});

test('@smoke address book module loads', async ({ page }) => {
  expect(await (await new AddressBookPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke notifications module loads', async ({ page }) => {
  expect(await (await new NotificationsPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke rewards module loads', async ({ page }) => {
  expect(await (await new RewardsPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke referrals module loads', async ({ page }) => {
  expect(await (await new ReferralsPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke team module loads', async ({ page }) => {
  expect(await (await new TeamPage(page).open()).isLoaded()).toBe(true);
});

test('@smoke profile module loads', async ({ page }) => {
  expect(await (await new ProfilePage(page).open()).isLoaded()).toBe(true);
});

test('@smoke transactions module loads', async ({ page }) => {
  expect(await (await new TransactionsPage(page).open()).isLoaded()).toBe(true);
});
