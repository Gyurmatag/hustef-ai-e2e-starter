// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect } from './fixtures';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { PAYEES, TransferPage } from './pages/TransferPage';
import { TRANSACTION_PIN } from './test-data';

// Fee rule: 0.3% of the amount, rounded, at least 200 HUF, at most 6,000 HUF. Total = amount + fee.
// The expected values are written out on purpose, so that a wrong formula cannot hide in the test.
const FEE_CASES = [
  { amount: '10000', shown: '10,000 HUF', fee: '200 HUF', total: '10,200 HUF', why: 'minimum (0.3% is 30)' },
  { amount: '66833', shown: '66,833 HUF', fee: '200 HUF', total: '67,033 HUF', why: '0.3% is 200.499, rounds to 200' },
  { amount: '66834', shown: '66,834 HUF', fee: '201 HUF', total: '67,035 HUF', why: '0.3% is 200.502, rounds to 201' },
  { amount: '100000', shown: '100,000 HUF', fee: '300 HUF', total: '100,300 HUF', why: '0.3%' },
  { amount: '2000000', shown: '2,000,000 HUF', fee: '6,000 HUF', total: '2,006,000 HUF', why: 'maximum' },
];

const kiss = PAYEES.kissPeter;

// Runs in the with-auth project (playwright.config.ts): every test starts already signed in as the demo user.
test.describe('Domestic transfer', () => {
  test.beforeEach(async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.heading).toBeVisible();
  });

  test('Send 100,000 HUF from the Everyday Account', { tag: '@high' }, async ({ page, gremlinRelease }) => {
    // BUG (release 3): the review page shows Fee 3,000 HUF and Total 103,000 HUF for 100,000 HUF.
    // Expected Fee 300 HUF and Total 100,300 HUF (0.3%, min 200, max 6,000 HUF). Not healed: the expected
    // values stay as they are. Classified BUG in heal-report.json. test.fail() keeps the test running: it turns red when the fee is fixed.
    test.fail(gremlinRelease === 3, 'BUG release 3: fee is 3% instead of 0.3% (expected 300 HUF, observed 3,000 HUF)');
    const transfer = new TransferPage(page);
    const review = new ReviewPage(page);
    const dashboard = new DashboardPage(page);

    // 1. Open the transfer form
    await transfer.goto();

    // 2. Everyday Account, Kiss Péter, check the IBAN
    await transfer.fromAccount.selectOption({ label: 'Everyday Account' });
    await transfer.beneficiaryName.fill(kiss.name);
    await transfer.iban.fill(kiss.iban);
    await transfer.checkIbanButton.click();
    await expect(page.getByText(/^IBAN verified: GRM-[A-Z0-9]+-[A-Z0-9]+$/)).toBeVisible();

    // 3. Amount and reference, continue to the review page
    await transfer.amount.fill('100000');
    await transfer.reference.fill('Rent October');
    await transfer.continueButton.click();
    await expect(review.heading).toBeVisible();
    await expect(review.value('From')).toHaveText('Everyday Account');
    await expect(review.value('To')).toHaveText('Kiss Péter');
    await expect(review.value('IBAN')).toHaveText(kiss.iban);
    await expect(review.value('Amount')).toHaveText('100,000 HUF');
    await expect(review.value('Fee')).toHaveText('300 HUF');
    await expect(review.value('Total')).toHaveText('100,300 HUF');

    // 4. PIN with the keyboard (closed shadow root), confirm
    await review.enterPin(TRANSACTION_PIN);
    await review.confirmButton.click();
    await expect(review.paymentDialog).toBeVisible();
    await expect(review.paymentFrame.getByText('Approve this payment of 100,300 HUF')).toBeVisible();

    // 5. Approve in the payment frame
    await review.approveButton.click();
    await expect(review.doneHeading).toBeVisible();
    await expect(page.getByText(/^Reference: GB-[A-Z0-9]{6}$/)).toBeVisible();
    await expect(page.getByText(/^Code: GRM-[A-Z0-9]+-[A-Z0-9]+$/)).toBeVisible();
    await expect(page.getByText(/^PIN check passed: GRM-[A-Z0-9]+-[A-Z0-9]+$/)).toBeVisible();

    // 6. The dashboard shows the new balance and the transaction
    await dashboard.goto();
    await expect(dashboard.balanceOf('Everyday Account')).toHaveText('1,149,700 HUF');
    await expect(dashboard.balanceOf('Savings Account')).toHaveText('5,400,000 HUF');
    await expect(dashboard.transactionRows().first()).toHaveText(/Transfer to Kiss Péter\s*-100,300 HUF$/);
  });

  test('Saved payee fills the name and the IBAN', { tag: '@low' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    await transfer.goto();

    // 1. "Use Tóth Bence"
    await transfer.useSavedPayee(PAYEES.tothBence.name).click();
    await expect(transfer.beneficiaryName).toHaveValue('Tóth Bence');
    await expect(transfer.iban).toHaveValue('HU03 9990 3033 1732 0508 0756 8879');

    // The IBAN still has to be checked
    await transfer.submit({ amount: '5000' });
    await expect(transfer.message('Check the IBAN first.')).toBeVisible();
  });

  test('Required fields', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    await transfer.goto();

    // 1. Continue with an empty form
    await transfer.continueButton.click();
    await expect(transfer.message('Enter a payee name.')).toBeVisible();
    await expect(transfer.message('Check the IBAN first.')).toBeVisible();
    await expect(transfer.message('Enter an amount greater than 0.')).toBeVisible();
    await expect(page).toHaveURL(/\/transfer$/);
  });

  test('An IBAN with wrong check digits is rejected', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    await transfer.goto();

    // 1. Wrong check digits
    await transfer.iban.fill('HU00 9990 1017 1618 0339 8874 9892');
    await transfer.checkIbanButton.click();
    await expect(transfer.message('Invalid IBAN')).toBeVisible();
  });

  test('A valid IBAN has to be checked before continuing', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    await transfer.goto();

    // 1. Valid IBAN, not checked
    await transfer.submit({ beneficiary: kiss.name, iban: kiss.iban, checkIban: false, amount: '5000' });
    await expect(transfer.message('Check the IBAN first.')).toBeVisible();
  });

  test('Editing a checked IBAN needs a new check', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    await transfer.goto();

    // 1. Check a valid IBAN
    await transfer.iban.fill(kiss.iban);
    await transfer.checkIbanButton.click();
    await expect(page.getByText(/^IBAN verified: GRM-[A-Z0-9]+-[A-Z0-9]+$/)).toBeVisible();

    // 2. Edit it and continue
    await transfer.iban.fill('HU72 9990 1017 1618 0339 8874 9893');
    await transfer.continueButton.click();
    await expect(transfer.message('Check the IBAN first.')).toBeVisible();
  });

  for (const amount of ['0', '-5', '12.5', 'abc']) {
    test(`Amount "${amount}" is refused`, { tag: '@high' }, async ({ page }) => {
      const transfer = new TransferPage(page);

      // 1. Zero, negative, decimal and text are not a positive whole number
      await transfer.goto();
      await transfer.submit({ beneficiary: kiss.name, iban: kiss.iban, amount });
      await expect(transfer.message('Enter an amount greater than 0.')).toBeVisible();
    });
  }

  test('1 HUF is accepted with the minimum fee', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    const review = new ReviewPage(page);

    // 1. The smallest positive whole amount reaches the review page
    await transfer.goto();
    await transfer.submit({ beneficiary: kiss.name, iban: kiss.iban, amount: '1' });
    await expect(review.heading).toBeVisible();
    await expect(review.value('Amount')).toHaveText('1 HUF');
    await expect(review.value('Fee')).toHaveText('200 HUF');
    await expect(review.value('Total')).toHaveText('201 HUF');
  });

  test('Daily limit boundary: 2,000,000 and 2,000,001', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    const review = new ReviewPage(page);

    // 1. 2,000,000 from the Savings Account reaches the review page
    await transfer.goto();
    await transfer.submit({ from: 'Savings Account', beneficiary: kiss.name, iban: kiss.iban, amount: '2000000' });
    await expect(review.heading).toBeVisible();
    await expect(review.value('Amount')).toHaveText('2,000,000 HUF');

    // 2. 2,000,001 is above the daily limit
    await transfer.goto();
    await transfer.submit({ from: 'Savings Account', beneficiary: kiss.name, iban: kiss.iban, amount: '2000001' });
    await expect(transfer.message('Daily limit of 2,000,000 HUF exceeded.')).toBeVisible();
  });

  test('Single transfer limit boundary: 10,000,000 and 10,000,001', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);

    // 1. 10,000,001 is above the single transfer limit
    await transfer.goto();
    await transfer.submit({ from: 'Savings Account', beneficiary: kiss.name, iban: kiss.iban, amount: '10000001' });
    await expect(transfer.message('The maximum single transfer is 10,000,000 HUF.')).toBeVisible();

    // 2. 10,000,000 passes the single limit and stops at the daily limit
    await transfer.goto();
    await transfer.submit({ from: 'Savings Account', beneficiary: kiss.name, iban: kiss.iban, amount: '10000000' });
    await expect(transfer.message('Daily limit of 2,000,000 HUF exceeded.')).toBeVisible();
    await expect(transfer.message('The maximum single transfer is 10,000,000 HUF.')).toBeHidden();
  });

  for (const c of FEE_CASES) {
    test(`Fee for ${c.shown} is ${c.fee} (${c.why})`, { tag: '@high' }, async ({ page, gremlinRelease }) => {
      // BUG (release 3): the fee is 3% of the amount, capped at 60,000 HUF (observed: 10,000 -> 300,
      // 66,833 -> 2,005, 66,834 -> 2,005, 100,000 -> 3,000, 2,000,000 -> 60,000). Expected 0.3%, min 200,
      // max 6,000 HUF. Not healed, see heal-report.json. test.fail() turns red when the fee is fixed.
      test.fail(gremlinRelease === 3, `BUG release 3: fee is 3% instead of 0.3% (expected ${c.fee} for ${c.shown})`);
      const transfer = new TransferPage(page);
      const review = new ReviewPage(page);

      // 1. Submit from the Savings Account and read the review page
      await transfer.goto();
      await transfer.submit({ from: 'Savings Account', beneficiary: kiss.name, iban: kiss.iban, amount: c.amount });
      await expect(review.heading).toBeVisible();
      await expect(review.value('Amount')).toHaveText(c.shown);
      await expect(review.value('Fee')).toHaveText(c.fee);
      await expect(review.value('Total')).toHaveText(c.total);
    });
  }

  test('Insufficient funds boundary', { tag: '@high' }, async ({ page, gremlinRelease }) => {
    // BUG (release 3): 1,246,261 HUF from the Everyday Account (1,250,000 HUF) is refused with
    // "Insufficient funds." because the fee is 37,388 HUF (3%). Expected: review page with Fee 3,739 HUF and
    // Total 1,250,000 HUF. Not healed, see heal-report.json. test.fail() turns red when the fee is fixed.
    test.fail(gremlinRelease === 3, 'BUG release 3: fee is 3% instead of 0.3% (1,246,261 HUF refused, expected fee 3,739 HUF)');
    const transfer = new TransferPage(page);
    const review = new ReviewPage(page);

    // 1. 1,246,261 + 3,739 fee is exactly the Everyday balance of 1,250,000
    await transfer.goto();
    await transfer.submit({ from: 'Everyday Account', beneficiary: kiss.name, iban: kiss.iban, amount: '1246261' });
    await expect(review.heading).toBeVisible();
    await expect(review.value('Fee')).toHaveText('3,739 HUF');
    await expect(review.value('Total')).toHaveText('1,250,000 HUF');

    // 2. One forint more is too much
    await transfer.goto();
    await transfer.submit({ from: 'Everyday Account', beneficiary: kiss.name, iban: kiss.iban, amount: '1246262' });
    await expect(transfer.message('Insufficient funds.')).toBeVisible();

    // 3. Clearly above the balance
    await transfer.goto();
    await transfer.submit({ from: 'Everyday Account', beneficiary: kiss.name, iban: kiss.iban, amount: '1500000' });
    await expect(transfer.message('Insufficient funds.')).toBeVisible();
  });

  test('A wrong PIN is refused, the correct PIN goes through', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    const review = new ReviewPage(page);

    // 1. Review a 1,000 HUF transfer
    await transfer.goto();
    await transfer.submit({ beneficiary: kiss.name, iban: kiss.iban, amount: '1000' });
    await expect(review.heading).toBeVisible();

    // 2. Wrong PIN: an alert outside the PIN field, no payment dialog
    await review.enterPin('1111');
    await review.confirmButton.click();
    await expect(review.wrongPin).toBeVisible();
    await expect(review.paymentDialog).toBeHidden();

    // 3. Correct PIN: the payment is approved and submitted
    await review.confirmWithPin(TRANSACTION_PIN);
    await expect(review.doneHeading).toBeVisible();
    await expect(review.wrongPin).toBeHidden();
  });

  test('The daily limit counts transfers already sent', { tag: '@high' }, async ({ page }) => {
    const transfer = new TransferPage(page);
    const review = new ReviewPage(page);
    const nagy = PAYEES.nagyEszter;

    // 1. Send 1,500,000 from the Savings Account
    await transfer.goto();
    await transfer.submit({ from: 'Savings Account', beneficiary: nagy.name, iban: nagy.iban, amount: '1500000' });
    await expect(review.heading).toBeVisible();
    await review.confirmWithPin(TRANSACTION_PIN);

    // 2. 600,000 more is above the daily limit
    await transfer.goto();
    await transfer.submit({ from: 'Savings Account', beneficiary: nagy.name, iban: nagy.iban, amount: '600000' });
    await expect(transfer.message('Daily limit of 2,000,000 HUF exceeded.')).toBeVisible();

    // 3. 500,000 more is exactly the limit
    await transfer.goto();
    await transfer.submit({ from: 'Savings Account', beneficiary: nagy.name, iban: nagy.iban, amount: '500000' });
    await expect(review.heading).toBeVisible();
  });
});
