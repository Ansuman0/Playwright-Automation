import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { config, STORAGE_STATE } from '../src/utils/config';
import { LoginPage } from '../src/pages/login-page';
import { DashboardPage } from '../src/pages/dashboard-page';
import { getLogger } from '../src/utils/logger';

const log = getLogger('auth.setup');

setup('authenticate via Auth0', async ({ page }) => {
  log.info('=== Auth setup started ===');
  log.info(`BASE_URL      : ${config.baseUrl}`);
  log.info(`TEST_USERNAME : ${config.username || '(empty — check .env)'}`);
  log.info(`AUTH0_DOMAIN  : ${process.env.AUTH0_DOMAIN || '(default: auth0.com)'}`);
  log.info(`AUTH0_FRAGMENT: ${LoginPage.AUTH0_LOGIN_FRAGMENT}`);
  log.info(`STORAGE_STATE : ${STORAGE_STATE}`);

  if (!config.username || !config.password) {
    log.error('TEST_USERNAME / TEST_PASSWORD missing in .env');
    throw new Error(
      'TEST_USERNAME / TEST_PASSWORD missing. Copy .env.example to .env and fill them in.',
    );
  }

  const existsBefore = fs.existsSync(STORAGE_STATE);
  log.info(`storageState file exists before run: ${existsBefore}`);

  let needsLogin = true;

  await setup.step('Open app and detect auth state', async () => {
    log.info('Navigating to app — detecting Auth0 redirect vs silent SSO');
    const login = new LoginPage(page);
    try {
      needsLogin = await login.openForSetup();
    } catch (e) {
      log.error(`Navigation timed out. Current URL: ${page.url()}`);
      log.error(`Expected either Auth0 (${LoginPage.AUTH0_LOGIN_FRAGMENT}) or dashboard`);
      throw e;
    }
    if (needsLogin) {
      log.info(`Auth0 login page reached: ${page.url()}`);
    } else {
      log.info(`Already authenticated (silent SSO / env bypass) — URL: ${page.url()}`);
    }
  });

  if (needsLogin) {
    await setup.step('Enter credentials and submit', async () => {
      log.info(`Filling credentials for: ${config.username}`);
      const login = new LoginPage(page);
      await login.login(config.username, config.password);
      log.info('Credentials submitted — waiting for Auth0 redirect back to app');
    });

    await setup.step('Wait for redirect back to app', async () => {
      const login = new LoginPage(page);
      await login.waitForRedirectBack();
      log.info(`Redirect complete — URL: ${page.url()}`);
    });
  }

  await setup.step('Verify dashboard loaded', async () => {
    const dashboard = new DashboardPage(page);
    const loaded = await dashboard.isLoaded();
    log.info(`Dashboard loaded: ${loaded}  (URL: ${page.url()})`);
    expect(loaded, 'Login setup failed to reach dashboard').toBe(true);
  });

  await setup.step('Save storage state', async () => {
    fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
    await page.context().storageState({ path: STORAGE_STATE });
    const existsAfter = fs.existsSync(STORAGE_STATE);
    const size = existsAfter ? fs.statSync(STORAGE_STATE).size : 0;
    log.info(`storageState saved → ${STORAGE_STATE}  (exists: ${existsAfter}, bytes: ${size})`);
    if (size === 0) {
      log.warn('storageState file is 0 bytes — session may not have been captured correctly');
    }
  });

  log.info('=== Auth setup complete ===');
});
