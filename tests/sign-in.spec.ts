// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect, env } from './fixtures';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

test.describe('Sign in and sign out', () => {
  test('Sign in with valid credentials', { tag: '@high' }, async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // 1. Start in a fresh browser context (signed out) and open /
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(login.heading).toBeVisible();
    await expect(login.username).toBeVisible();
    await expect(login.password).toBeVisible();
    await expect(login.signInButton).toBeVisible();

    // 2. Fill "Username" and "Password" with the demo user, click "Sign in"
    await login.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.signedInAs).toHaveText(`Signed in as ${env('GREMLIN_USER')}`);
    await expect(dashboard.signOutButton).toBeVisible();
  });

  test('Wrong password is rejected', { tag: '@high' }, async ({ page }) => {
    const login = new LoginPage(page);

    // 1. Open /login in a fresh browser context
    await login.goto();
    await expect(login.heading).toBeVisible();

    // 2. Submit the demo user with a wrong password
    await login.signIn(env('GREMLIN_USER'), 'not-the-password');
    await expect(login.error).toHaveText('Wrong username or password.');
    await expect(page).toHaveURL(/\/login$/);
    await expect(login.username).toHaveValue(env('GREMLIN_USER'));

    // 3. Open /dashboard: no session was created
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Empty fields are rejected', { tag: '@medium' }, async ({ page }) => {
    const login = new LoginPage(page);

    // 1. Click "Sign in" without filling anything
    await login.goto();
    await login.signInButton.click();
    await expect(login.error).toHaveText('Wrong username or password.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('An unknown user gets the same message as a wrong password', { tag: '@medium' }, async ({ page }) => {
    const login = new LoginPage(page);

    // 1. Unknown user with a valid password: same message, nothing revealed about which part was wrong
    await login.goto();
    await login.signIn('no.such.user', env('GREMLIN_PASSWORD'));
    await expect(login.error).toHaveText('Wrong username or password.');
  });

  test('Five wrong attempts lock the sign-in', { tag: '@high' }, async ({ page }) => {
    // Gremlin Bank keeps the lockout in this browser context's state. In a real application, run this test
    // with its own test account: a server-side lockout of the shared user would break every other test.
    const login = new LoginPage(page);
    await login.goto();

    // 2. Four wrong passwords
    for (let attempt = 1; attempt <= 4; attempt++) {
      await login.signIn(env('GREMLIN_USER'), `wrong-${attempt}`);
      await expect(login.error).toHaveText('Wrong username or password.');
    }

    // 3. The fifth wrong password locks the sign-in
    await login.signIn(env('GREMLIN_USER'), 'wrong-5');
    await expect(login.error).toHaveText('Too many attempts. Wait 60 seconds.');

    // 4. The correct password is refused while locked. The lockout message is already on the page, so first
    //    wait for the server's answer, then check the outcome that matters: no session was created.
    const answered = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/login');
    await login.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
    await answered;
    await expect(login.error).toHaveText('Too many attempts. Wait 60 seconds.');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Sign out ends the session', { tag: '@high' }, async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    await login.signInAsDemo();
    await expect(dashboard.heading).toBeVisible();

    // 1. Click "Sign out"
    await dashboard.signOutButton.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(login.heading).toBeVisible();

    // 2. Protected pages redirect to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/transfer');
    await expect(page).toHaveURL(/\/login$/);
  });
});
