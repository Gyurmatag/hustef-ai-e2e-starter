// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect } from './fixtures';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ACCOUNTS } from './test-data';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).signInAsDemo();
    await expect(new DashboardPage(page).heading).toBeVisible();
  });

  test('Accounts are shown with IBAN and opening balance', { tag: '@medium' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. "Loading accounts..." disappears and the accounts appear (random 0.3-2.5 s; web-first assertions wait)
    await expect(dashboard.account('Everyday Account')).toBeVisible();
    await expect(dashboard.loading).toBeHidden();

    // 2. Everyday Account
    await expect(dashboard.ibanOf('Everyday Account')).toHaveText(ACCOUNTS.everyday.iban);
    await expect(dashboard.balanceOf('Everyday Account')).toHaveText('1,250,000 HUF');

    // 3. Savings Account
    await expect(dashboard.ibanOf('Savings Account')).toHaveText(ACCOUNTS.savings.iban);
    await expect(dashboard.balanceOf('Savings Account')).toHaveText('5,400,000 HUF');
  });

  test('Recent transactions show the seeded history', { tag: '@medium' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. Column headers and the five seeded rows, newest first
    await expect(dashboard.transactions.getByRole('columnheader')).toHaveText(['Date', 'Description', 'Amount']);
    await expect(dashboard.transactionRows()).toHaveText([
      /^2026-09-30\s*Grocery store, Budapest\s*-18,450 HUF$/,
      /^2026-09-29\s*Salary, Gremlin Works Ltd\.\s*\+685,000 HUF$/,
      /^2026-09-27\s*Mobile phone bill\s*-7,990 HUF$/,
      /^2026-09-25\s*Card payment, bookshop\s*-12,300 HUF$/,
      /^2026-09-24\s*Transfer from Savings Account\s*\+50,000 HUF$/,
    ]);
  });

  test('Spending chart data is available as a table', { tag: '@medium' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. The chart is a canvas without text; the accessible alternative is a button
    await expect(dashboard.chartDataTable).toBeHidden();

    // 2. "Show chart data" reveals a table with one row per day
    await dashboard.showChartDataButton.click();
    await expect(dashboard.chartDataTable).toBeVisible();
    await expect(dashboard.chartDataTable.getByRole('columnheader')).toHaveText(['Date', 'Amount']);
    await expect(dashboard.chartDataRows()).toHaveCount(30);
    for (const row of await dashboard.chartDataRows().all()) {
      await expect(row).toHaveText(/^\d{4}-\d{2}-\d{2}\s*[\d,]+ HUF$/);
    }
  });

  test('Session code, security indicator, rate and tip are present', { tag: '@low' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. Present and well-formed; the rate and the tip change on every load, so only their format is checked
    await expect(dashboard.sessionCode).toHaveText(/^Session code: GRM-[A-Z0-9]+-[A-Z0-9]+$/);
    await expect(dashboard.securityIndicator).toBeVisible();
    await expect(dashboard.exchangeRate).toHaveText(/^EUR\/HUF\s*\d{3}\.\d{2}$/);
    await expect(dashboard.tipOfTheDay).not.toBeEmpty();
  });

  test('New transfer opens the transfer form', { tag: '@medium' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. Open "New transfer" (in the "Payments" menu since release 2)
    await dashboard.openNewTransfer();
    await expect(page).toHaveURL(/\/transfer$/);
    await expect(page.getByRole('heading', { level: 1, name: 'New transfer' })).toBeVisible();
  });
});
