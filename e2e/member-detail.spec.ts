import { test, expect } from '@playwright/test';

/**
 * E2E smoke tests for admin member detail page.
 *
 * Run with: npx playwright test e2e/member-detail.spec.ts
 *
 * Requires TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD (admin with at least one club/member).
 */

test.describe('Member detail page', () => {
  test('admin can view member detail from users table', async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      return;
    }

    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await page.waitForURL(/\/(login|$|\/admin)/, { timeout: 10000 });

    await page.goto('/admin/users');

    await expect(
      page.getByRole('heading', { name: /user management/i })
    ).toBeVisible({ timeout: 10000 });

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });

    const rowCount = await table.locator('tbody tr').count();
    if (rowCount === 0) {
      test.skip(true, 'No members in table - add a member first');
      return;
    }

    const firstRow = table.locator('tbody tr').first();
    const moreButton = firstRow.getByRole('button');
    await moreButton.click();

    await page.getByRole('menuitem', { name: /view/i }).click();

    await expect(page).toHaveURL(/\/admin\/members\/[^/]+/);
    await expect(page.getByRole('button', { name: /edit member/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/profile/i)).toBeVisible();
  });

  test('invalid member id shows error', async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      return;
    }

    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await page.waitForURL(/\/(login|$|\/admin)/, { timeout: 10000 });

    await page.goto('/admin/members/00000000-0000-0000-0000-000000000000');

    await expect(page.getByText(/member not found|something went wrong/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('button', { name: /go back/i })).toBeVisible();
  });
});
