import { test, expect, env, pinRelease } from '../fixtures';
import { signIn, skipCookieDialog } from './support';

// Lab 5, wall 2b: push approval on a phone, with number matching.
//
// With a human (--debug=cli or --debug): the pause-and-attach pattern.
//   1. npx playwright test tests/walls/push-login.spec.ts --debug=cli
//      The test starts paused and prints: Run "playwright-cli attach tw-xxxxxx"
//   2. npx playwright cli attach tw-xxxxxx
//      npx playwright cli -s=tw-xxxxxx resume
//      The test signs in and pauses again on "Approve sign-in on your phone".
//   3. A human scans the QR code (or opens the "Can't scan?" link) and taps the number on the screen.
//   4. The attached agent reads the dashboard, then: npx playwright cli -s=tw-xxxxxx resume
//
// Without a human (CI, a plain `npx playwright test`): the test plays the phone itself. It reads the number
// and the phone link from the page and answers in a second browser context, like a second device.
// This works only because push.tester is a test user whose "phone" is a web page. For a real second
// factor, keep the human step and use the pause-and-attach pattern.

// playwright.config.ts sets PW_DEBUG_MODE to "cli" or "inspector" when you run with --debug=cli or --debug.
const debugMode = process.env.PW_DEBUG_MODE;

// The human has to see the number on the laptop screen, so open a visible browser window.
if (debugMode) test.use({ headless: false });

test('push.tester approves the sign-in on a phone', async ({ page, context, baseURL, browser }) => {
  test.setTimeout(debugMode ? 10 * 60_000 : 60_000);

  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_PUSH_USER'), env('GREMLIN_PASSWORD'));
  await expect(page.getByRole('heading', { name: 'Approve sign-in on your phone' })).toBeVisible();

  if (debugMode) {
    // Human step: scan the QR code with your phone, or open the link under "Can't scan?" on your phone or
    // in a second browser window, and tap the number shown on this page. The request expires after 5 minutes.
    await page.pause();
  } else {
    // No human: answer on a "phone" (a separate browser context with a mobile viewport).
    const number = (await page.getByTestId('push-number').innerText()).trim();
    const link = await page.getByTestId('push-link').getAttribute('href');
    expect(link, 'phone link under "Can\'t scan?"').toBeTruthy();
    const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await pinRelease(phoneContext, baseURL!);
    const phone = await phoneContext.newPage();
    await phone.goto(link!);
    await expect(phone.getByText('Sign-in request for push.tester. Which number do you see on your screen?')).toBeVisible();
    await phone.getByRole('button', { name: number, exact: true }).click();
    await expect(phone.getByText('Approved. You can go back to your computer.')).toBeVisible();
    await phoneContext.close();
  }

  // The page polls every 2 seconds and continues to the dashboard once the phone approved.
  await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible({ timeout: debugMode ? 5 * 60_000 : 15_000 });
  const approved = page.getByText(/^Approved on your phone: /);
  await expect(approved).toBeVisible();
  console.log(await approved.innerText());
});
