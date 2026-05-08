# Playwright-Automation
This Playwright automation framework is developed in **TypeScript** for the **Artha SAAS Application** to perform end-to-end testing of web application functionalities. The framework is designed using a scalable and maintainable structure that supports automated UI testing, regression testing, smoke testing, and cross-browser execution.

### Key Features

* Built using [Playwright](https://playwright.dev/?utm_source=chatgpt.com) with **TypeScript**
* Supports **Chromium, Firefox, and WebKit** browsers
* Follows **Page Object Model (POM)** design pattern
* Data-driven testing support using JSON/Excel
* Reusable utility methods and common functions
* Integrated reporting with **HTML/Allure Reports**
* Screenshot and video capture for failed test cases
* Environment-based configuration handling
* Parallel test execution support
* API and UI automation support
* Easy CI/CD integration with tools like Jenkins and GitHub Actions

### Framework Structure

* **pages/** → Contains page classes and locators
* **tests/** → Contains test scripts and test scenarios
* **utils/** → Reusable helper methods and utilities
* **fixtures/** → Common setup and teardown methods
* **test-data/** → Stores test input data
* **config/** → Environment and framework configuration
* **reports/** → Generated execution reports
* **screenshots/** → Failure screenshots

### Main Objectives

* Reduce manual testing effort
* Improve test coverage and execution speed
* Ensure application stability after every release
* Support continuous testing during sprint cycles
* Quickly identify defects with detailed reports and logs

### Technologies Used

* [TypeScript](https://www.typescriptlang.org/?utm_source=chatgpt.com)
* [Node.js](https://nodejs.org/?utm_source=chatgpt.com)
* [Playwright](https://playwright.dev/?utm_source=chatgpt.com)
* [Allure Report](https://allurereport.org/?utm_source=chatgpt.com)
* [GitHub](https://github.com/?utm_source=chatgpt.com)
* [Jenkins](https://www.jenkins.io/?utm_source=chatgpt.com)

### Benefits

* Faster execution compared to manual testing
* Better maintainability and scalability
* Reliable cross-browser validation
* Detailed reporting and debugging support
* Easy onboarding for QA team members
* Supports agile and continuous delivery process

This framework helps ensure the quality, reliability, and performance of the Artha SAAS Application through efficient automated testing processes.

# ArthaPay Neo-Bank â€” E2E Test Automation

Playwright + TypeScript end-to-end test suite for the ArthaPay neo-bank web UI. The target URL is configured via environment variables â€” no URLs are hardcoded in the project.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 20 or later | JavaScript runtime |
| npm | bundled with Node | Package manager |
| Git | any | Source control |

---

## Install Node.js (if not already installed)

**Check if Node.js is installed:**

```bash
node --version
npm --version
```

If you see `v20.x.x` or higher, skip this section. If the command is not found or the version is below 20, install Node.js using one of the options below.

### Option 1 â€” Official installer (recommended for Windows/Mac)

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS** version (20.x or later)
3. Run the installer and follow the prompts â€” npm is included automatically
4. Restart your terminal, then verify:

```bash
node --version
npm --version
```

### Option 2 â€” winget (Windows)

```powershell
winget install OpenJS.NodeJS.LTS
```

### Option 3 â€” Homebrew (macOS/Linux)

```bash
brew install node@20
```

### Option 4 â€” nvm (Node Version Manager â€” any OS)

nvm lets you switch between Node versions easily.

**macOS/Linux:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # or ~/.zshrc on macOS
nvm install 20
nvm use 20
```

**Windows (nvm-windows):**
1. Download the installer from [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)
2. Run `nvm-setup.exe`
3. Then in a new terminal:

```powershell
nvm install 20
nvm use 20
```

---

## Installation

**1. Clone the repository**

```bash
git clone <repo-url>
cd TestAutomation
```

**2. Install Node dependencies**

```bash
npm install
```

**3. Install Playwright browsers**

```bash
npx playwright install
```

This downloads Chromium and Firefox engines (~300 MB total) managed by Playwright.

**4. Configure environment variables**

Copy the template and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
BASE_URL=https://your-environment.example.com/
TEST_USERNAME=your.email@example.com
TEST_PASSWORD=your_password_here
TIMEOUT=20
AUTH0_DOMAIN=auth0.com
```

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Full URL of the app under test | `https://dev.artha.work/` |
| `TEST_USERNAME` | Login email for the test account | _(required)_ |
| `TEST_PASSWORD` | Login password for the test account | _(required)_ |
| `TIMEOUT` | Per-action timeout in seconds | `20` |
| `AUTH0_DOMAIN` | Auth0 domain used for redirect detection | `auth0.com` |

> `.env` is git-ignored and must never be committed.

---

## Running Tests

### Full test suite

```bash
npm test
```

Runs all tests on Chromium and Firefox in parallel. Auth session is set up automatically before any test runs.

### Filtered by tag

| Command | What it runs |
|---------|-------------|
| `npm run test:smoke` | Fast sanity checks (`@smoke` tag) |
| `npm run test:regression` | Full regression coverage (`@regression` tag) |
| `npm run test:transfer` | Real money-moving transactions (`@transfer` tag) â€” **dev environment only** |

### Single spec file

```bash
npm test -- tests/dashboard.spec.ts
npm test -- tests/login.spec.ts
```

### Interactive modes (recommended for development)

```bash
npm run test:ui      # Playwright UI Mode â€” pick tests, watch them run, inspect traces
npm run test:headed  # Run tests with a visible browser window
```

### View the HTML report

```bash
npm run report
```

Opens the last run's HTML report in your browser. Reports are stored in `reports/html/`.

### Type-check only (no tests run)

```bash
npm run typecheck
```

### Generate tests interactively (codegen)

```bash
npm run codegen
```

Opens a browser pointed at `BASE_URL` from `.env`; every click and fill is recorded as Playwright code.

---

## Project Structure

```
TestAutomation/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ pages/           # Page Object Model â€” one class per screen
â”‚   â”‚   â”œâ”€â”€ base-page.ts         # Shared helpers (isVisible, goto, urlContains)
â”‚   â”‚   â”œâ”€â”€ login-page.ts        # Auth0 Universal Login
â”‚   â”‚   â”œâ”€â”€ dashboard-page.ts
â”‚   â”‚   â”œâ”€â”€ exchange-page.ts     # Buy / Sell crypto
â”‚   â”‚   â”œâ”€â”€ wallets-page.ts      # Crypto & fiat wallets
â”‚   â”‚   â”œâ”€â”€ payments-page.ts
â”‚   â”‚   â”œâ”€â”€ cards-page.ts
â”‚   â”‚   â””â”€â”€ ...                  # One file per feature area
â”‚   â””â”€â”€ utils/
â”‚       â”œâ”€â”€ config.ts            # Reads .env; exports baseUrl, credentials, auth0Domain, storageState path
â”‚       â”œâ”€â”€ logger.ts            # Lightweight console logger
â”‚       â””â”€â”€ routes.ts            # All app URL paths as named constants
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ auth.setup.ts            # Runs once â€” logs in via Auth0, caches session to .auth/
â”‚   â”œâ”€â”€ login.spec.ts
â”‚   â”œâ”€â”€ dashboard.spec.ts
â”‚   â”œâ”€â”€ exchange-buy.spec.ts
â”‚   â”œâ”€â”€ exchange-sell.spec.ts
â”‚   â”œâ”€â”€ wallets.spec.ts
â”‚   â”œâ”€â”€ payments.spec.ts
â”‚   â””â”€â”€ ...                      # One spec file per feature
â”œâ”€â”€ .auth/                       # Git-ignored â€” cached Auth0 session (auto-created)
â”œâ”€â”€ reports/html/                # Git-ignored â€” HTML test reports
â”œâ”€â”€ .env                         # Git-ignored â€” your local credentials
â”œâ”€â”€ .env.example                 # Template â€” copy to .env and fill in values
â”œâ”€â”€ playwright.config.ts         # Playwright configuration (browsers, timeouts, reporters)
â”œâ”€â”€ tsconfig.json                # TypeScript compiler options
â””â”€â”€ package.json                 # Scripts and dependencies
```

---

## How Authentication Works

Tests do **not** log in individually. Instead:

1. The `setup` project runs `tests/auth.setup.ts` once before anything else.
2. It logs in through Auth0 and saves the session to `.auth/user.json`.
3. Every subsequent test loads that saved session via Playwright's `storageState` â€” no login screen is hit again.

The `no-auth` project (used by `login.spec.ts` and `forgot-password.spec.ts`) deliberately skips the saved session so it can test the login flow itself.

---

## Test Tags

Tests are tagged in their title string and can be run selectively:

| Tag | Meaning |
|-----|---------|
| `@smoke` | Fast subset â€” runs in < 5 minutes, safe for every commit |
| `@regression` | Full suite â€” run before releases |
| `@transfer` | Moves real money â€” **dev environment only**, requires sufficient account balance |

Example tag usage in a test title:

```typescript
test('dashboard loads @smoke', async ({ page }) => { ... });
```

---

## Key Dependencies

| Package | Version | Role |
|---------|---------|------|
| `@playwright/test` | ^1.49.0 | Test runner, browser automation, assertions |
| `typescript` | ^5.6.0 | Type-safe JavaScript |
| `dotenv` | ^16.4.5 | Load `.env` variables into `process.env` |
| `@types/node` | ^22.10.0 | Node.js type definitions |

Playwright also bundles its own Chromium and Firefox binaries â€” no separate browser install needed beyond `npx playwright install`.

---

## Playwright Configuration Highlights

Defined in [playwright.config.ts](playwright.config.ts):

- **Base URL:** read from `BASE_URL` in `.env` (fallback: `https://dev.artha.work/`)
- **Viewport:** 1440 Ã— 900
- **Test timeout:** 90 seconds per test
- **Expect timeout:** 10 seconds per assertion
- **Parallelism:** All tests run in parallel (50% of CPU locally, 2 workers in CI)
- **Retries:** 0 locally, 1 in CI
- **Artifacts on failure:** screenshot, video, trace (available in the HTML report)
- **Browsers:** Chromium, Firefox (both reuse the cached auth session)

---

## Writing a New Test

1. **Find or create the page object** in `src/pages/` for the screen you're testing.
2. Add locators and action methods to the page object class (no assertions inside page objects).
3. **Create a spec file** in `tests/` (or add to an existing one).
4. Use `@smoke` or `@regression` tags in the test title.
5. Run: `npm run test:ui` to develop interactively, then `npm test -- tests/your-new.spec.ts` to verify.
6. Run `npm run typecheck` before committing.

See [TRAINING.md](TRAINING.md) for a step-by-step worked example and full project conventions.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Error: Cannot find module` | Run `npm install` |
| `browserType.launch: Executable doesn't exist` | Run `npx playwright install` |
| `TEST_USERNAME is not defined` | Create `.env` from `.env.example` and fill in all required variables |
| Auth0 redirect never detected | Check `AUTH0_DOMAIN` in `.env` matches your Auth0 tenant domain |
| Auth0 redirect timeout | Dev environment may be slow; the setup test allows 45 s â€” retry once |
| Test fails on missing element | Open trace in `npm run report` â†’ Trace tab for step-by-step DOM snapshots |
| TypeScript errors | Run `npm run typecheck` and fix before running tests |

For interactive debugging, `npm run test:ui` is the fastest way to isolate a failing test â€” it shows each step, the DOM state, and the network log side by side.

---

## CI/CD

A ready-to-use GitHub Actions workflow is provided at [.github/workflows/playwright.yml](.github/workflows/playwright.yml). All URLs and credentials are injected from CI variables — nothing is hardcoded.

Set the following in your CI system under **Settings → Environments → \<env-name\> → Secrets & variables**:

| Name | Type | Description |
|------|------|-------------|
| `BASE_URL` | Variable | Full URL of the app for this environment |
| `AUTH0_DOMAIN` | Variable | Auth0 domain (default: `auth0.com`) |
| `TIMEOUT` | Variable | Per-action timeout in seconds (default: `20`) |
| `TEST_USERNAME` | Secret | Service-account email |
| `TEST_PASSWORD` | Secret | Service-account password |

Example for GitHub Actions (values come from environment variables, not the code):

```yaml
env:
  BASE_URL: ${{ vars.BASE_URL }}
  AUTH0_DOMAIN: ${{ vars.AUTH0_DOMAIN }}
  TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
  TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
  TIMEOUT: ${{ vars.TIMEOUT || '20' }}
  CI: true
```

`CI=true` automatically:
- Reduces parallel workers to 2
- Enables 1 retry per failing test
- Disables the interactive HTML reporter (uses list reporter instead)

For other CI systems (GitLab CI, Azure Pipelines, Jenkins), set the same variables as environment secrets/variables in your pipeline config — no code changes required.

---

## Further Reading

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [TRAINING.md](TRAINING.md) â€” team onboarding guide with detailed explanations of every concept used in this repo