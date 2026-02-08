import { test, expect } from '@playwright/test';

/**
 * E2E tests for admin route protection (Auth RBAC).
 *
 * Run with: npx playwright test e2e/admin-access.spec.ts
 *
 * For tests that require authenticated admin users, set TEST_ADMIN_EMAIL and
 * TEST_ADMIN_PASSWORD in .env.test or environment.
 */

test.describe('Admin route protection', () => {
  test('unauthenticated user is redirected to login when accessing /admin', async ({
    page,
  }) => {
    // Fresh context = no auth cookies; try to access admin directly
    await page.goto('/admin/club-management');

    // Should redirect to login
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('unauthenticated user is redirected to login when accessing /admin root', async ({
    page,
  }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/auth\/login/);
  });

  test('admin route returns 200 for authenticated admin (club owner)', async ({
    page,
  }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      return;
    }

    // Log in
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for redirect after login
    await page.waitForURL(/\/(login|$|\/admin)/, { timeout: 10000 });

    // Navigate to admin
    await page.goto('/admin/club-management');

    // Should load (not redirect to home)
    await expect(page).not.toHaveURL(/\/(auth\/login|auth\/signup)$/);
    // Club management page should show content
    await expect(
      page.getByRole('heading', { name: /club|Clubs|Welcome/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
