import type { Locator, Page } from '@playwright/test';
import { env } from '../fixtures';

export class LoginPage {
  readonly heading: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;
  readonly error: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Sign in to Gremlin Bank' });
    this.username = page.getByRole('textbox', { name: 'Username' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.error = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.signInButton.click();
  }

  /** Opens /login and signs in as GREMLIN_USER with GREMLIN_PASSWORD from .env. */
  async signInAsDemo(): Promise<void> {
    await this.goto();
    await this.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
  }
}
