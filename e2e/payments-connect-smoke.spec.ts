import { expect, test } from "@playwright/test";

test.describe("Payment settings smoke", () => {
  test("admin can open payment settings page", async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      return;
    }

    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(login|$|\/admin)/, { timeout: 10000 });

    await page.goto("/admin/payments");
    await expect(page.getByRole("heading", { name: /payments/i })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("link", { name: /payment settings/i }).click();
    await expect(page).toHaveURL(/\/admin\/payments\/settings$/);
    await expect(
      page.getByRole("heading", { name: /payment settings/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/stripe connect status/i)).toBeVisible();
  });
});
