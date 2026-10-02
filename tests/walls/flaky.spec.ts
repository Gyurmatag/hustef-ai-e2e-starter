import { test, expect, env } from '../fixtures';
import { signIn, skipCookieDialog } from './support';

// Lab 5, wall 4: non-determinism, fixed.
//
//   npx playwright test tests/walls/flaky.spec.ts --repeat-each=10 --reporter=list,./reporters/steady.ts
//
// The dashboard shows a "Loading accounts..." spinner for a random 0.3-2.5 s, a random tip of the day and
// a random EUR/HUF rate on every load. The fix: web-first assertions that wait (no fixed timeout), and the
// format of the random values instead of their value.

test('dashboard shows the balance and the exchange rate', async ({ page, context, baseURL }) => {
  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));

  // Waits until the spinner is gone and the balance is there (up to the expect timeout, 7 s).
  await expect(page.getByText('1,250,000 HUF')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Loading accounts...' })).toBeHidden();

  // The rate changes on every load: check that it is a rate, not which one.
  await expect(page.getByText(/^EUR\/HUF /)).toHaveText(/^EUR\/HUF\s*\d{3}\.\d{2}$/);
});
