# Test Automation Training

A hands-on guide for team members who have **never written automated tests before**. By the end you'll be able to run, read, debug, and write Playwright tests in this repo.

Read top to bottom on day 1. After that, treat it as a reference.

---

## Table of contents

1. [What is test automation, and why do we do it?](#1-what-is-test-automation-and-why-do-we-do-it)
2. [How this repo is organized](#2-how-this-repo-is-organized)
3. [Set up your machine (15 min)](#3-set-up-your-machine-15-min)
4. [Run your first test](#4-run-your-first-test)
5. [Read a test, line by line](#5-read-a-test-line-by-line)
6. [The Page Object Model](#6-the-page-object-model)
7. [Playwright in 10 minutes](#7-playwright-in-10-minutes)
8. [Write your first test (worked example)](#8-write-your-first-test-worked-example)
9. [Debugging when a test fails](#9-debugging-when-a-test-fails)
10. [Conventions and gotchas in this codebase](#10-conventions-and-gotchas-in-this-codebase)
11. [Pre-PR checklist](#11-pre-pr-checklist)
12. [Where to get help](#12-where-to-get-help)

---

## 1. What is test automation, and why do we do it?

A **test** is code that drives the app the way a real user would, and asserts that the result matches what we expect.

> Example: open `/exchange/buy`, type `0` into the amount field, expect a validation error to appear.

**Why automated, not manual?**

- Same flow gets executed identically every time → no "I forgot to check that".
- Runs in seconds → catches breakage before it reaches users.
- Runs on every commit (CI) → blocks bad merges.

**What we test in this repo:** end-to-end (E2E) — the full SPA running against the dev backend, in a real browser. Not unit tests, not API tests.

**What we don't test:**
- Things that need a fresh disposable account every time (some KYC flows). The code already auto-skips those with a clear reason.
- Things outside our app (the Auth0 login UI itself — we use it but don't assert against its internals).

---

## 2. How this repo is organized

```
neo-bank-automation/
├── playwright.config.ts        # global config: timeouts, projects, parallelism
├── package.json                # npm scripts: `npm test`, `npm run test:smoke`, etc.
├── tsconfig.json               # TypeScript settings
├── .env                        # YOUR credentials — never commit this
├── .auth/                      # cached login state (gitignored)
├── src/
│   ├── pages/                  # Page Objects: one class per app screen
│   │   ├── base-page.ts        # shared helpers all page objects inherit
│   │   ├── login-page.ts       # Auth0 login form
│   │   ├── dashboard-page.ts   # /dashboard
│   │   ├── exchange-page.ts    # /exchange/buy, /exchange/sell + summary + success
│   │   └── ... (one per module)
│   └── utils/
│       ├── config.ts           # reads .env, exposes baseUrl/username/password
│       └── routes.ts           # all app URLs as constants
└── tests/
    ├── auth.setup.ts           # logs in once, saves session for every other test
    ├── dashboard.spec.ts
    ├── exchange-buy.spec.ts
    └── ... (one .spec.ts per feature)
```

**Two terms you'll see everywhere:**

- **Page Object** — a class in `src/pages/` representing one screen. It owns the selectors and exposes high-level actions like `clickSave()`, `isLoaded()`. Tests never touch raw selectors directly.
- **Spec** — a file in `tests/` ending `.spec.ts`. Each spec contains one or more `test(...)` blocks that use page objects to drive the app and `expect(...)` to assert.

---

## 3. Set up your machine (15 min)

### Prerequisites
- Node.js 20+ (`node --version` to check)
- Git
- VS Code (recommended) with the **Playwright Test for VSCode** extension

### Install

```powershell
# from the repo root
npm install
npx playwright install        # downloads Chromium / Firefox / WebKit (one-time, ~500 MB)
```

### Configure credentials

Copy `.env.example` to `.env`, then fill in your test account:

```
BASE_URL=https://dev.artha.work/
TEST_USERNAME=your.test.user@example.com
TEST_PASSWORD=your_password
TIMEOUT=20
```

> **Never commit `.env`.** It's already in `.gitignore`. Use a dedicated test user — not your personal account.

### Verify setup

```powershell
npm run typecheck       # should print nothing (success)
npm test -- --list      # should list ~250 tests
```

If `--list` works, you're ready.

---

## 4. Run your first test

Run the dashboard smoke tests:

```powershell
npm test -- tests/dashboard.spec.ts
```

What happens:
1. Playwright runs `tests/auth.setup.ts` first — logs into Auth0 once and saves the session to `.auth/user.json`.
2. Each subsequent test starts already logged in — so they're fast.
3. You'll see something like `3 passed (37.1s)`.

### Useful run modes

| Command | What it does |
|---|---|
| `npm test` | Run the full suite |
| `npm run test:smoke` | Run only `@smoke` tests (fast sanity check) |
| `npm run test:regression` | Run only `@regression` tests |
| `npm run test:transfer` | Run money-moving tests (dev only — these execute real transactions) |
| `npm run test:headed` | Show the browser while tests run (good for watching what's happening) |
| `npm run test:ui` | **Best for development.** Opens Playwright UI mode — pick tests, see traces, time-travel debugging |
| `npm run report` | Open the last HTML report (failures, screenshots, traces) |

> Start with `npm run test:ui`. It's by far the easiest way to learn.

---

## 5. Read a test, line by line

Open [tests/payees.spec.ts](tests/payees.spec.ts):

```ts
import { test, expect } from '@playwright/test';
import { PayeesPage, FiatPayeeFormPage } from '../src/pages/payees-page';

test('@smoke payees list loads', async ({ page }) => {
  expect(await (await new PayeesPage(page).open()).isLoaded()).toBe(true);
});
```

Walking through it:

| Line | What it means |
|---|---|
| `import { test, expect } from '@playwright/test'` | `test` defines a test; `expect` is the assertion |
| `import { PayeesPage, ... }` | Pull in the page object for `/payees` |
| `test('@smoke payees list loads', async (...))` | Defines a test. The `@smoke` in the title is a **tag** — used by `npm run test:smoke` to filter |
| `({ page })` | Playwright gives you a fresh browser tab in the `page` fixture |
| `new PayeesPage(page).open()` | Construct the page object, navigate to `/payees` |
| `.isLoaded()` | Page object method — returns `true` if the page rendered |
| `expect(...).toBe(true)` | Fail the test if `isLoaded()` returned `false` |

**Tags in test titles:**
- `@smoke` — fast sanity check, runs on every PR
- `@regression` — broader coverage
- `@transfer` — moves real money on dev; only run deliberately

Add the tag in the test title and the test runner can filter by it.

---

## 6. The Page Object Model

Every screen in the app gets one class in `src/pages/`. Three rules:

1. **Selectors live in page objects, never in tests.** If `.ant-menu` ever changes to `.app-menu`, you change one file, not 50.
2. **Page objects expose intent, not mechanics.** A test calls `page.clickLogout()`, not `page.locator('.logout-btn').click()`.
3. **Page objects don't assert.** They return data; tests assert.

Look at [src/pages/dashboard-page.ts](src/pages/dashboard-page.ts):

```ts
export class DashboardPage extends BasePage {
  static readonly URL_FRAGMENT = AuthRoutes.DASHBOARD;

  readonly profilePhoto: Locator = this.page.locator("img[alt*='profile photo' i]").first();
  readonly appMenu: Locator = this.page.locator("[role='menu'], .ant-menu");
  readonly logoutButton: Locator = this.page.locator('button.logout-btn');

  async open(): Promise<this> {
    await this.goto(DashboardPage.URL_FRAGMENT);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.appMenu, 20_000);
  }
}
```

- `extends BasePage` — gets the common `goto`, `isVisible`, `urlContains` helpers.
- Selectors are `readonly` `Locator` properties at the top.
- Methods (`open`, `isLoaded`) are the public API for tests.
- `AuthRoutes.DASHBOARD` comes from [src/utils/routes.ts](src/utils/routes.ts) — never hard-code URLs.

---

## 7. Playwright in 10 minutes

### Locators: how you find elements

Prefer in this order:

```ts
// 1. Role + accessible name (most resilient)
page.getByRole('button', { name: 'Logout' });

// 2. Label/text the user sees
page.getByLabel('Email');
page.getByText('Account created');

// 3. Test ID (we have ZERO of these — but the pattern):
// page.getByTestId('login-submit');

// 4. CSS — last resort
page.locator('.ant-menu');
```

### Actions

```ts
await locator.click();
await locator.fill('hello');               // for inputs
await locator.selectOption('USD');         // for native <select>
await locator.check();                     // for checkboxes
await locator.hover();
await locator.scrollIntoViewIfNeeded();
```

All of these **auto-wait** for the element to be visible, enabled, and stable. You almost never need explicit `sleep`.

### Assertions

```ts
// Element-level (auto-retries until pass or timeout)
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Saved');
await expect(locator).toHaveValue('100');
await expect(locator).toBeDisabled();

// Page-level
await expect(page).toHaveURL(/.*\/dashboard/);

// Plain values (no auto-retry)
expect(count).toBe(3);
expect(message).toContain('Success');
```

> **Use `await expect(locator).toBeVisible()` instead of `if (await locator.isVisible())`.** The `expect` form auto-retries until it passes; the `if` form gives one snapshot.

### Waiting

99% of the time you don't need to wait — locators auto-wait. The exceptions:

```ts
await page.waitForURL((u) => u.toString().includes('/summary/'));
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);            // last resort, avoid in committed code
```

### Skipping conditionally

```ts
if (!(await page.someConditionVisible())) {
  test.skip(true, 'Reason — visible in test output');
}
```

We use this heavily for KYC-gated and balance-dependent tests.

---

## 8. Write your first test (worked example)

**Goal:** assert that the Wallets page shows a "Crypto" tab and a "Fiat" tab.

### Step 1 — find the right page object

We have [src/pages/wallets-page.ts](src/pages/wallets-page.ts). Read it first.

### Step 2 — check existing tests for the pattern

Look at [tests/modules.spec.ts](tests/modules.spec.ts) — it already covers the basic "page loads" case. Our new test goes alongside it OR in a new file `tests/wallets.spec.ts`. For one test, add it to `modules.spec.ts`.

### Step 3 — add the test

```ts
test('@smoke wallets page shows Crypto and Fiat tabs', async ({ page }) => {
  const wallets = new WalletsPage(page);
  await wallets.openCrypto();
  await expect(wallets.cryptoTab).toBeVisible();
  await expect(wallets.fiatTab).toBeVisible();
});
```

### Step 4 — run only this test while developing

```powershell
npm test -- tests/modules.spec.ts --grep "Crypto and Fiat tabs" --headed
```

Watching the browser shows you exactly what the test does. Fix selectors / waits until it's green.

### Step 5 — verify it still passes when you remove `--headed`

Headed runs are sometimes more forgiving than headless. Always confirm headless before merging.

### Step 6 — commit

```powershell
git checkout -b feat/wallets-tabs-test
git add tests/modules.spec.ts
git commit -m "test: assert Wallets shows Crypto and Fiat tabs"
```

---

## 9. Debugging when a test fails

### First: read the failure summary

```
Error: expect(locator).toBeVisible() failed
Locator: locator('button.logout-btn')
Expected: visible
Error: element is not visible
```

This already tells you what was looked for and why it failed.

### Second: open the trace

After any failed run:

```powershell
npm run report
```

Or directly:

```powershell
npx playwright show-trace test-results/<test-folder>/trace.zip
```

The trace viewer shows:
- Every action and assertion as a timeline
- Screenshots at each step
- Network requests
- The DOM as it was at that exact moment — you can hover and see what selectors would have matched

This is the single most powerful debugging tool. **Learn it.**

### Third: rerun in UI mode

```powershell
npm run test:ui
```

Lets you re-run a test, set breakpoints, and step through.

### Fourth: common failure patterns

| Error | Likely cause | Fix |
|---|---|---|
| `locator resolved to N elements` | Strict-mode violation — multiple matches | Add `.first()` or narrow the selector |
| `element is not visible` | Element exists in DOM but is `display:none`, off-screen, or behind another element | `scrollIntoViewIfNeeded()`, or check viewport / responsive variants |
| `Timeout 30000ms exceeded` waiting for `goto` | Dev environment slow / down | Wait, retry — or check the dev environment is up |
| `Login setup failed to reach dashboard` | Auth0 creds in `.env` are wrong, or session expired | Double-check `.env`, delete `.auth/user.json`, rerun |
| Test passes locally but fails in CI | Timing / parallel resource contention | Look at the trace from CI; usually a missing wait |

---

## 10. Conventions and gotchas in this codebase

These are non-obvious things you'll trip over otherwise.

### Authentication is shared via `storageState`
[tests/auth.setup.ts](tests/auth.setup.ts) does the Auth0 login **once**, saves cookies to `.auth/user.json`, and every test in the `chromium` / `firefox` projects reuses it. That's why most tests start fast.

If your test needs to test login itself (e.g., logout flow), put it in [tests/login.spec.ts](tests/login.spec.ts) or [tests/forgot-password.spec.ts](tests/forgot-password.spec.ts) — those are part of the `no-auth` project and don't preload the session.

### `BasePage.goto()` uses `'domcontentloaded'`
Not the default `'load'`. That's because the SPA fires `load` very late (after every XHR settles). DOM ready is enough; locators auto-wait for elements to actually appear.

### Selectors that match BOTH desktop and mobile — pin with `.first()`
The header renders desktop and mobile variants in the DOM. If a CSS selector matches both, Playwright complains with "strict mode violation: resolved to 2 elements". Use `.first()` (or a more specific selector) to disambiguate. See `DashboardPage.profilePhoto` for an example.

### Many tests `test.skip()` themselves
Tests for features that depend on real money (fiat balances, KYC-approved accounts, configured beneficiaries) skip when the precondition isn't met. **A skip is not a failure.** It's announced clearly in the output.

### The app has zero `data-testid` attributes
We can't use the canonical Playwright pattern of `getByTestId(...)`. Stick with role+name, ant-design classes (`.ant-menu`, `.ant-tabs-tab`), form `name` attributes (`input[name='otp']`), and `href` matching for nav links.

### URLs always come from `routes.ts`
Never hard-code `/exchange/buy` in a test. Import `AuthRoutes` from [src/utils/routes.ts](src/utils/routes.ts) and use `AuthRoutes.EXCHANGE_BUY`. If the app renames a route, one constant changes — all tests follow.

### Money-moving tests are `@transfer` — they don't run by default
[tests/exchange-buy-e2e.spec.ts](tests/exchange-buy-e2e.spec.ts) and [tests/transfer.spec.ts](tests/transfer.spec.ts) execute real transactions. They only run when you explicitly do `npm run test:transfer`. **Never run them on prod.**

### Timeouts: when to override the default
- Default action / expect timeout: 10s (in `playwright.config.ts`).
- For known-slow operations (Auth0 round-trip, Buy flow → Stripe → success can take 90s), pass an explicit longer timeout: `await expect(locator).toBeVisible({ timeout: 90_000 })`.
- For an `isVisible()` race like `isLoaded()`, the timeout is a single budget for the whole race — keep it generous (15-20s).

---

## 11. Pre-PR checklist

Before opening a PR with new tests:

- [ ] **Headless run is green** — `npm test -- tests/your-spec.ts` (no `--headed`)
- [ ] **Typecheck is clean** — `npm run typecheck`
- [ ] **No selectors in test files** — they belong in page objects
- [ ] **No hard-coded URLs** — use `routes.ts`
- [ ] **Tag the test** — `@smoke`, `@regression`, or `@transfer` in the title
- [ ] **Test name reads like a sentence** — `@smoke payees list loads`, not `test1`
- [ ] **No `console.log` left in committed code**
- [ ] **No `waitForTimeout(...)`** — use auto-wait or explicit `waitFor*` instead
- [ ] **Test fails when the feature is broken** — manually break the feature (or change a selector to wrong) and confirm the test catches it. A test that always passes is worse than no test.

---

## 12. Where to get help

- **Playwright official docs** — https://playwright.dev/docs/intro (probably the best testing docs on the internet)
- **Playwright API reference** — https://playwright.dev/docs/api/class-playwright
- **`npm run test:ui`** — interactive mode is the fastest way to learn locators
- **Existing tests in `tests/`** — read three before writing one. Pattern-match.
- **The UI source** — `C:\Users\SubbaReddy\Desktop\Workspace\Artha\WEB\User\src\` — when a selector breaks, check the component to see what the rendered DOM actually looks like
- **Trace viewer** — `npm run report` after any failure
- **Team channel** — ask early. Don't burn an afternoon on a selector that someone else has already fought.

---

## Appendix A — minimal page object template

When you need to add a new page object:

```ts
// src/pages/foo-page.ts
import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthRoutes } from '../utils/routes';

export class FooPage extends BasePage {
  readonly heading: Locator = this.page.getByRole('heading', { name: 'Foo' });
  readonly submitButton: Locator = this.page.getByRole('button', { name: 'Submit' });

  async open(): Promise<this> {
    await this.goto(AuthRoutes.FOO);
    return this;
  }

  isLoaded(): Promise<boolean> {
    return this.isVisible(this.heading, 15_000);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
```

## Appendix B — minimal spec template

```ts
// tests/foo.spec.ts
import { test, expect } from '@playwright/test';
import { FooPage } from '../src/pages/foo-page';

test.beforeEach(async ({ page }) => {
  await new FooPage(page).open();
});

test('@smoke foo page loads', async ({ page }) => {
  expect(await new FooPage(page).isLoaded()).toBe(true);
});

test('@regression submit shows success message', async ({ page }) => {
  const foo = new FooPage(page);
  await foo.submit();
  await expect(page.getByText('Success')).toBeVisible();
});
```

---

**Last updated:** 2026-05-07
