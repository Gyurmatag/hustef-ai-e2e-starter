import { expect, type Locator, type Page } from '@playwright/test';
import type { AccountName } from './DashboardPage';

export interface TransferForm {
  from?: AccountName;
  beneficiary?: string;
  iban?: string;
  /** Click "Check IBAN" after filling the IBAN (default true). */
  checkIban?: boolean;
  amount?: string;
  reference?: string;
}

/** Saved payees on the transfer page (fictional, valid Hungarian IBANs). */
export const PAYEES = {
  kissPeter: { name: 'Kiss Péter', iban: 'HU72 9990 1017 1618 0339 8874 9892' },
  nagyEszter: { name: 'Nagy Eszter', iban: 'HU71 9990 2025 1414 2135 6237 3099' },
  tothBence: { name: 'Tóth Bence', iban: 'HU03 9990 3033 1732 0508 0756 8879' },
} as const;

export class TransferPage {
  readonly heading: Locator;
  readonly fromAccount: Locator;
  readonly beneficiaryName: Locator;
  readonly iban: Locator;
  readonly checkIbanButton: Locator;
  readonly amount: Locator;
  readonly reference: Locator;
  readonly continueButton: Locator;
  readonly savedPayees: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'New transfer' });
    this.fromAccount = page.getByRole('combobox', { name: 'From account' });
    this.beneficiaryName = page.getByRole('textbox', { name: 'Beneficiary name' });
    // <gb-iban-input> has an open shadow root: role locators reach inside it.
    this.iban = page.getByRole('textbox', { name: 'IBAN' });
    this.checkIbanButton = page.getByRole('button', { name: 'Check IBAN' });
    this.amount = page.getByRole('textbox', { name: 'Amount (HUF)' });
    this.reference = page.getByRole('textbox', { name: 'Reference', exact: true });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.savedPayees = page.getByRole('complementary', { name: 'Saved payees' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/transfer');
    await expect(this.heading).toBeVisible();
  }

  /** A validation message or IBAN check result shown on the form. */
  message(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  useSavedPayee(name: string): Locator {
    return this.savedPayees.getByRole('button', { name: `Use ${name}` });
  }

  /** Fills the given fields (labels decide, not the order) and clicks "Continue". */
  async submit(form: TransferForm): Promise<void> {
    if (form.from) await this.fromAccount.selectOption({ label: form.from });
    if (form.beneficiary !== undefined) await this.beneficiaryName.fill(form.beneficiary);
    if (form.iban !== undefined) {
      await this.iban.fill(form.iban);
      if (form.checkIban !== false) await this.checkIbanButton.click();
    }
    if (form.amount !== undefined) await this.amount.fill(form.amount);
    if (form.reference !== undefined) await this.reference.fill(form.reference);
    await this.continueButton.click();
  }
}
