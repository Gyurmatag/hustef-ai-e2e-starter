import type { FrameLocator, Locator, Page } from '@playwright/test';
import { expect } from '../fixtures';

export type DetailRow = 'From' | 'To' | 'IBAN' | 'Amount' | 'Fee' | 'Total';

export class ReviewPage {
  readonly heading: Locator;
  readonly details: Locator;
  readonly confirmButton: Locator;
  readonly wrongPin: Locator;
  readonly paymentDialog: Locator;
  readonly paymentFrame: FrameLocator;
  readonly approveButton: Locator;
  readonly doneHeading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Review transfer' });
    this.details = page.getByRole('table', { name: 'Transfer details' });
    this.confirmButton = page.getByRole('button', { name: 'Send money' });
    this.wrongPin = page.getByRole('alert').filter({ hasText: 'Wrong PIN.' });
    this.paymentDialog = page.getByRole('dialog', { name: 'Payment approval' });
    this.paymentFrame = this.paymentDialog.getByTitle('Payment approval').contentFrame();
    this.approveButton = this.paymentFrame.getByRole('button', { name: 'Approve', exact: true });
    this.doneHeading = page.getByRole('heading', { level: 1, name: 'Money sent' });
  }

  /** Value cell of a row of the "Transfer details" table (row header + value). */
  value(row: DetailRow): Locator {
    return this.details
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name: row, exact: true }) })
      .getByRole('cell');
  }

  /**
   * The PIN input is inside a CLOSED shadow root (<gb-secure-pin>): no locator and no aria snapshot reaches it.
   * Keyboard focus does: focus the confirm button, Shift+Tab into the PIN field, type.
   */
  async enterPin(pin: string): Promise<void> {
    await this.confirmButton.focus();
    await this.page.keyboard.press('Shift+Tab');
    await this.page.keyboard.type(pin);
  }

  /**
   * Enters the PIN, confirms, approves in the payment dialog and waits for the confirmation page.
   * The waits check that the right page is showing; the business checks stay in the tests.
   */
  async confirmWithPin(pin: string): Promise<void> {
    await this.enterPin(pin);
    await this.confirmButton.click();
    await expect(this.paymentDialog).toBeVisible();
    await this.approveButton.click();
    await expect(this.doneHeading).toBeVisible();
  }
}
