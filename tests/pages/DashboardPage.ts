import type { Locator, Page } from '@playwright/test';

export type AccountName = 'Everyday Account' | 'Savings Account';

export class DashboardPage {
  readonly heading: Locator;
  readonly loading: Locator;
  readonly signedInAs: Locator;
  readonly signOutButton: Locator;
  readonly paymentsMenuButton: Locator;
  readonly newTransferMenuItem: Locator;
  readonly sessionCode: Locator;
  readonly securityIndicator: Locator;
  readonly exchangeRate: Locator;
  readonly tipOfTheDay: Locator;
  readonly transactions: Locator;
  readonly showChartDataButton: Locator;
  readonly chartDataTable: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Accounts' });
    this.loading = page.getByRole('status').filter({ hasText: 'Loading accounts...' });
    this.signedInAs = page.getByRole('banner').getByText(/^Signed in as/);
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
    // Release 2: "New transfer" moved from a link into the "Payments" menu.
    this.paymentsMenuButton = page.getByRole('button', { name: 'Payments' });
    this.newTransferMenuItem = page.getByRole('menuitem', { name: 'New transfer' });
    this.sessionCode = page.getByText(/^Session code: /);
    this.securityIndicator = page.getByRole('img', { name: /^Security check passed/ });
    this.exchangeRate = page.getByText(/^EUR\/HUF /);
    // The tip card has no accessible name, so there is no role-based way to reach its text. Its test id is
    // the same in every release. Testability request: label the card ("Tip of the day" as region name).
    this.tipOfTheDay = page.getByTestId('tip-of-the-day').getByRole('paragraph');
    this.transactions = page.getByRole('table', { name: 'Recent transactions' });
    this.showChartDataButton = page.getByRole('button', { name: 'Show chart data' });
    this.chartDataTable = page.getByRole('table', { name: /^Spending in the last 30 days/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  /** Opens the transfer form through the "Payments" menu. */
  async openNewTransfer(): Promise<void> {
    await this.paymentsMenuButton.click();
    await this.newTransferMenuItem.click();
  }

  /** The row of one account in the "Your accounts" table (release 2 replaced the account cards with this table). */
  account(name: AccountName): Locator {
    return this.page
      .getByRole('table', { name: 'Your accounts' })
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name, exact: true }) });
  }

  /** The IBAN of an account, for example "HU39 9992 0265 3141 5926 5358 9797". */
  ibanOf(name: AccountName): Locator {
    return this.account(name).getByText(/^HU\d{2}( \d{4}){6}$/);
  }

  /** The balance of an account, for example "1,250,000 HUF". */
  balanceOf(name: AccountName): Locator {
    return this.account(name).getByText(/^[\d,]+ HUF$/);
  }

  /** Data rows of the recent transactions table (without the header row). */
  transactionRows(): Locator {
    return this.transactions.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  /** Data rows of the chart data table (without the header row). */
  chartDataRows(): Locator {
    return this.chartDataTable.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }
}
