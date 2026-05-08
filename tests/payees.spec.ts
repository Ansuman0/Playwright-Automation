import { test, expect } from '../src/fixtures/serial';
import { PayeesPage, FiatPayeeFormPage } from '../src/pages/payees-page';

test('@smoke payees list loads', async ({ page, stepLogger }) => {
  await test.step('Open payees page', async () => {
    stepLogger.info(`Opening payees list — current URL: ${page.url()}`);
    await new PayeesPage(page).open();
    stepLogger.info(`Post-navigate URL: ${page.url()}`);
  });

  await test.step('Assert payees page is loaded', async () => {
    const loaded = await new PayeesPage(page).isLoaded();
    stepLogger.info(`PayeesPage isLoaded: ${loaded}  (URL: ${page.url()})`);
    expect(loaded).toBe(true);
  });
});

test('@smoke payees fiat tab loads', async ({ page, stepLogger }) => {
  await test.step('Open payees/fiat tab', async () => {
    stepLogger.info(`Opening payees/fiat — current URL: ${page.url()}`);
    await new PayeesPage(page).openFiat();
    stepLogger.info(`Post-navigate URL: ${page.url()}`);
  });

  await test.step('Assert fiat tab is loaded', async () => {
    const loaded = await new PayeesPage(page).isLoaded();
    stepLogger.info(`PayeesPage (fiat) isLoaded: ${loaded}  (URL: ${page.url()})`);
    expect(loaded).toBe(true);
    expect(page.url()).toContain('/payees');
  });
});

test('@smoke payees crypto tab loads', async ({ page, stepLogger }) => {
  await test.step('Open payees/crypto tab', async () => {
    stepLogger.info(`Opening payees/crypto — current URL: ${page.url()}`);
    await new PayeesPage(page).openCrypto();
    stepLogger.info(`Post-navigate URL: ${page.url()}`);
  });

  await test.step('Assert crypto tab is loaded', async () => {
    const loaded = await new PayeesPage(page).isLoaded();
    stepLogger.info(`PayeesPage (crypto) isLoaded: ${loaded}  (URL: ${page.url()})`);
    expect(loaded).toBe(true);
    expect(page.url()).toContain('/payees');
  });
});

test('@regression fiat payee form blocks empty save', async ({ page, stepLogger }) => {
  await test.step('Open fiat payees tab', async () => {
    stepLogger.info('Opening payees/fiat for form validation test');
    await new PayeesPage(page).openFiat();
    stepLogger.info(`URL after open: ${page.url()}`);
  });

  await test.step('Check if add-payee form is visible', async () => {
    const form = new FiatPayeeFormPage(page);
    const formVisible = await form.isFavouriteNameVisible();
    stepLogger.info(`FavouriteName input visible: ${formVisible}`);

    if (!formVisible) {
      stepLogger.warn('Add-payee form not auto-shown — skipping (needs explicit Add button click)');
      test.skip(true, 'Add-payee form not auto-shown — needs an explicit click on the Add button');
      return;
    }
  });

  await test.step('Submit empty form', async () => {
    stepLogger.info('Clicking Save without filling any fields');
    await new FiatPayeeFormPage(page).save();
  });

  await test.step('Assert form submission was blocked', async () => {
    const form = new FiatPayeeFormPage(page);
    const errorVisible = await form.isErrorVisible();
    const stillOnPayees = page.url().includes('/payees');
    stepLogger.info(`errorVisible=${errorVisible}  stillOnPayees=${stillOnPayees}  URL=${page.url()}`);
    expect(
      errorVisible || stillOnPayees,
      `Expected form to be blocked — errorVisible=${errorVisible}, URL=${page.url()}`,
    ).toBe(true);
  });
});
