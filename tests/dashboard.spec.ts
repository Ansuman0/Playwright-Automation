import { test, expect } from '@playwright/test';
import { DashboardPage } from '../src/pages/dashboard-page';
import { HeaderPage } from '../src/pages/header-page';
import { LoginPage } from '../src/pages/login-page';

test.beforeEach(async ({ page }) => {
  await new DashboardPage(page).open();
});

test('@smoke dashboard loads after login', async ({ page }) => {
  expect(await new DashboardPage(page).isLoaded()).toBe(true);
});

test('@smoke sidebar profile area is visible', async ({ page }) => {
  const dash = new DashboardPage(page);
  await expect(dash.appMenu).toBeVisible({ timeout: 15_000 });
  await expect(dash.profilePhoto).toBeVisible({ timeout: 10_000 });
  await expect(dash.manageAccountLink).toBeVisible({ timeout: 5_000 });
});

test('@regression logout returns to login', async ({ page }) => {
  await new HeaderPage(page).clickLogout();
  const login = new LoginPage(page);
  await expect(login.usernameInput, 'Did not return to login after logout').toBeVisible({
    timeout: 30_000,
  });
});
