// Test data of the demo user. Gremlin Bank is fictional: these IBANs and amounts exist only in the demo app.
import { env } from './fixtures';

/** Transaction PIN of the demo users (test data), from GREMLIN_PIN in .env. Never commit a real PIN. */
export const TRANSACTION_PIN = env('GREMLIN_PIN');

export const ACCOUNTS = {
  everyday: { name: 'Everyday Account', iban: 'HU39 9992 0265 3141 5926 5358 9797' },
  savings: { name: 'Savings Account', iban: 'HU03 9992 0265 2718 2818 2845 9043' },
} as const;

