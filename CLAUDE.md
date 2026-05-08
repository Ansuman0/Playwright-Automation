# ArthaTech — Playwright E2E Test Automation Suite

## What This Project Is

End-to-end test automation for **ArthaPay**, a neo-bank web application built by ArthaTech. The suite covers authentication, navigation, wallets, crypto exchange, payees, and more. Built with Playwright + TypeScript using the Page Object Model pattern.

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| [Playwright](https://playwright.dev) | ^1.49.0 | Browser automation & test runner |
| TypeScript | ^5.6.0 | Type-safe test code |
| Node.js | 20+ | Runtime |
| dotenv | ^16.4.5 | Environment variable loading |

---

## Prerequisites

- Node.js 20+
- npm 9+
- A `.env` file (copy `.env.example` and fill in credentials)

---

## First-Time Setup

```bash
git clone <repo-url>
cd TestAutomation

npm install
npx playwright install --with-deps

cp .env.example .env
# Open .env and fill in your credentials (see Environment Variables below)
```

---

## Environment Variables

File: `.env` (never committed — see `.env.example` for template)

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `BASE_URL` | `https://dev.artha.work/` | Yes | App URL under test |
| `TEST_USERNAME` | `user@example.com` | Yes | Test account email |
| `TEST_PASSWORD` | `secret` | Yes | Test account password |
| `TIMEOUT` | `20` | No | Per-action timeout in seconds (default 20) |
| `AUTH0_DOMAIN` | `auth0.com` | No | Auth0 domain for redirect detection |
| `BROWSER` | `chromium` | No | Browser: `chromium`, `firefox`, `webkit`, or `all` |

---

## Running Tests

```bash
npm test                    # Full suite (Chromium + Firefox, parallel)
npm run test:smoke          # @smoke tests only — fast, sequential, headed
npm run test:regression     # @regression tests only — full coverage
npm run test:transfer       # @transfer tests only — real money moves, dev env only
npm run test:headed         # Full suite with visible browser window
npm run test:firefox        # Full suite on Firefox only
npm run test:ui             # Playwright UI mode (interactive picker)

npm run report              # Open last HTML report
npm run report:advanced     # Open custom advanced HTML report with charts
npm run report:kpi          # Print KPI markdown summary in terminal

npm run codegen             # Launch interactive test recorder
npm run typecheck           # TypeScript type check only (no tests)
```

### Test Tags

Tests are tagged in their titles. Filter with `--grep`:

```bash
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @transfer     # dev environment + balance required
```

| Tag | When to run | Notes |
|-----|------------|-------|
| `@smoke` | Every commit | < 5 min, no side effects |
| `@regression` | Before releases | Full coverage |
| `@transfer` | Dev only, manually | Real money movement — requires account balance |

---

## Project Structure

```
TestAutomation/
├── .auth/                  # Cached Auth0 session (git-ignored)
├── .github/workflows/
│   └── playwright.yml      # CI/CD: smoke on PR, smoke+regression on push to main
├── reports/                # Test artifacts (git-ignored)
│   ├── html/               # Playwright standard HTML report
│   ├── json/               # JSON results
│   ├── kpi/                # KPI markdown summaries
│   └── advanced/           # Custom HTML report with charts
├── scripts/
│   └── codegen.js          # Playwright codegen wrapper
├── src/
│   ├── pages/              # Page Object Model classes (one file per screen)
│   ├── utils/
│   │   ├── config.ts       # Loads .env, exports config object + urlFor()
│   │   ├── logger.ts       # Colored console logger with timestamps
│   │   └── routes.ts       # Central registry of all app URLs
│   ├── fixtures/
│   │   ├── index.ts        # Custom test fixture: stepLogger + auto-screenshot
│   │   └── serial.ts       # Worker-scoped fixture for sequential smoke tests
│   └── reporters/
│       ├── kpi-reporter.ts     # Generates markdown KPI summary
│       └── html-reporter.ts    # Generates advanced HTML report with donut chart
├── tests/
│   ├── auth.setup.ts           # Logs in once, caches session to .auth/user.json
│   ├── login.spec.ts
│   ├── dashboard.spec.ts
│   ├── smoke-routes.spec.ts    # Navigates every static route
│   ├── navigation.spec.ts      # Top-nav link tests
│   ├── exchange-buy.spec.ts
│   ├── exchange-sell.spec.ts
│   ├── exchange-buy-e2e.spec.ts
│   ├── exchange-sell-e2e.spec.ts
│   ├── wallets.spec.ts
│   ├── transfer.spec.ts
│   ├── payees.spec.ts
│   ├── modules.spec.ts
│   ├── mfa.spec.ts
│   └── forgot-password.spec.ts
├── .env.example
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Authentication Architecture

Authentication runs **once** before any test:

1. `auth.setup.ts` logs in via Auth0 → saves browser storage state to `.auth/user.json`
2. Every authenticated test loads that cached session via `storageState`
3. Login screen is never hit again during the test run
4. Login/forgot-password tests use the **no-auth** project (no cached session)

The setup project is a dependency in `playwright.config.ts`:
```typescript
{ name: 'chromium', dependencies: ['setup'], use: { storageState: STORAGE_STATE } }
```

---

## Page Object Model

Every app screen has a dedicated class in `src/pages/`. All extend `BasePage`.

### BasePage helpers

```typescript
isVisible(locator, timeout?)   // returns boolean, never throws
urlContains(fragment, timeout?) // waits for URL to contain string
goto(routePath)                // navigates to config.baseUrl + routePath
```

### Existing Page Objects

| Class | File | Screen |
|-------|------|--------|
| `BasePage` | base-page.ts | Shared helpers |
| `LoginPage` | login-page.ts | Auth0 Universal Login |
| `DashboardPage` | dashboard-page.ts | /dashboard |
| `ExchangePage` | exchange-page.ts | Buy/Sell crypto |
| `WalletsPage` | wallets-page.ts | Crypto & fiat wallets |
| `HeaderPage` | header-page.ts | Global nav & logout |
| `CardsPage` | cards-page.ts | Card management |
| `PaymentsPage` | payments-page.ts | Payment vaults |
| `BanksPage` | banks-page.ts | Bank accounts |
| `PayeesPage` | payees-page.ts | Fiat & crypto payees |
| `AddressBookPage` | address-book-page.ts | Saved addresses |
| `TransactionsPage` | transactions-page.ts | Transaction history |
| `ProfilePage` | profile-page.ts | User profile & security |
| `NotificationsPage` | notifications-page.ts | Notifications |
| `RewardsPage` | rewards-page.ts | Rewards & quests |
| `ReferralsPage` | referrals-page.ts | Referral program |
| `TeamPage` | team-page.ts | Team management |
| `MfaPage` | mfa-page.ts | Multi-factor auth |
| `ForgotPasswordPage` | forgot-password-page.ts | Password reset |

---

## Writing a New Test

### 1. Import the custom fixture (not the raw Playwright test)

```typescript
import { test, expect } from '../src/fixtures';
import { DashboardPage } from '../src/pages/dashboard-page';
```

### 2. Use `test.step` and `stepLogger` for every logical step

```typescript
test('dashboard shows balance @smoke', async ({ page, stepLogger }) => {
  await test.step('Open dashboard', async () => {
    stepLogger.info('Navigating to dashboard');
    await new DashboardPage(page).open();
  });

  await test.step('Assert balance card visible', async () => {
    const dash = new DashboardPage(page);
    expect(await dash.isBalanceVisible()).toBe(true);
  });
});
```

### 3. Use routes from `routes.ts` — never hardcode URLs

```typescript
import { AuthRoutes } from '../src/utils/routes';
await page.goto(config.baseUrl + AuthRoutes.DASHBOARD);
```

### 4. Skip with a reason when conditions aren't met

```typescript
if (!accountHasBalance) {
  test.skip(true, 'Account has no balance — cannot test transfer');
}
```

### 5. Place tests in the right file and add tags

- Smoke check → add to existing `smoke-routes.spec.ts` or `modules.spec.ts`
- Feature test → add to the feature-specific spec file
- New feature with no spec → create `src/pages/new-page.ts` + `tests/new-feature.spec.ts`

---

## Adding a New Page Object

```typescript
// src/pages/my-feature-page.ts
import { Page } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

export class MyFeaturePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.goto(AuthRoutes.MY_FEATURE);
  }

  async isHeaderVisible(): Promise<boolean> {
    return this.isVisible(this.page.getByRole('heading', { name: 'My Feature' }));
  }
}
```

Then add the route to `src/utils/routes.ts` under `AuthRoutes` or `PublicRoutes`.

---

## Playwright Configuration Highlights

- **Base URL**: from `.env` `BASE_URL`
- **Parallelism**: 50% CPU locally, 2 workers in CI
- **Retries**: 0 locally, 1 in CI
- **Timeouts**: 90s per test, 10s per assertion
- **Screenshots/videos/traces**: on failure only
- **Anti-detection**: `--disable-blink-features=AutomationControlled`
- **Viewport**: `null` (maximized to OS window size on Chromium)

---

## CI/CD (GitHub Actions)

File: `.github/workflows/playwright.yml`

| Trigger | Tests Run |
|---------|----------|
| Push to `main`/`master` | Smoke + Regression |
| Pull Request to `main` | Smoke only |
| Manual dispatch | Choose environment (dev/staging/prod) |

**Required GitHub Secrets:**
- `TEST_USERNAME`
- `TEST_PASSWORD`

**Required GitHub Variables:**
- `BASE_URL`
- `AUTH0_DOMAIN`
- `TIMEOUT` (optional, defaults to 20)

Reports are uploaded as artifacts (14-day retention). Failure traces/screenshots retained 7 days.

---

## Key Conventions

1. **No raw `page.locator()` in tests** — only page object methods
2. **No hardcoded URLs** — use `config.baseUrl` + `routes.ts`
3. **Tags in test titles** — `'wallet loads correctly @smoke @regression'`
4. **`stepLogger.info()` in every step** — shows in HTML report
5. **`isVisible()` for conditional checks** — returns boolean, never throws
6. **`test.skip(true, 'reason')` over `.only` or fragile assertions** — always include a reason string
7. **Page objects handle all selectors** — tests stay readable
8. **No auth tests use `no-auth` project** — declare via `testOptions.project`

---

## Custom Reporters

### KPI Reporter (`src/reporters/kpi-reporter.ts`)
- Outputs `reports/kpi/{timestamp}/summary.md`
- Shows pass rate, breakdown by tag and spec file, slowest tests, failure list
- Run `npm run report:kpi` to view

### Advanced HTML Reporter (`src/reporters/html-reporter.ts`)
- Outputs `reports/advanced/{timestamp}/index.html`
- Interactive table with search/filter, donut chart, KPI cards
- Auto-opens in browser (skipped when `CI=true`)
- Run `npm run report:advanced` to view

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Error: .env not found` | Run `cp .env.example .env` and fill in credentials |
| `browserType.launch: Executable doesn't exist` | Run `npx playwright install` |
| Auth0 redirect loop | Check `TEST_USERNAME`/`TEST_PASSWORD` in `.env` |
| `Cannot find module '@pages/...'` | Run `npm install`; paths defined in `tsconfig.json` |
| Tests pass locally, fail in CI | Check GitHub Secrets match `.env.example` variable names |
| Slow tests on dev environment | Increase `TIMEOUT` in `.env` (e.g., `TIMEOUT=40`) |
| `@transfer` tests fail | Account needs balance; only run on dev environment |
