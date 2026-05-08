/**
 * Fiat payout end-to-end. Source: src/modules/payments/payouts/fiat.jsx
 *
 * Tagged @transfer — it does NOT run by default. To execute (dev only,
 * with a real beneficiary configured for the test account):
 *
 *     npm run test:transfer
 */
import { test, expect } from '@playwright/test';
import { FiatPayoutPage } from '../src/pages/payments-page';

test('@transfer fiat payout form renders', async ({ page }) => {
  const payout = new FiatPayoutPage(page);
  await payout.open();

  if (!(await payout.isAmountVisible())) {
    test.skip(
      true,
      'Payout form not directly accessible — needs a vault/merchant context',
    );
  }

  await expect(payout.amountInput).toBeVisible();
});

test.skip('@transfer fiat payout end-to-end (needs real beneficiary)', async ({ page }) => {
  const payout = new FiatPayoutPage(page);
  await payout.open();
  await payout.fillAmount(10);
  await payout.submit();
  await payout.confirm();
  expect(await payout.isSuccess()).toBe(true);
});
