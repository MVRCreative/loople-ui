import { expect, test } from "@playwright/test";

test.describe("Programs feature smoke", () => {
  test("admin can access program promotion controls", async ({ page }) => {
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

    await page.goto("/admin/programs");
    await expect(
      page.getByRole("heading", { name: /program management/i })
    ).toBeVisible({ timeout: 10000 });

    const viewButtons = page.getByRole("button", { name: /view/i });
    const viewCount = await viewButtons.count();
    if (viewCount === 0) {
      test.skip(true, "No programs found - create one before running this smoke test");
      return;
    }

    await viewButtons.first().click();

    await expect(page).toHaveURL(/\/admin\/programs\/[^/]+/);
    await expect(page.getByText(/share and promotion/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create registration post/i })
    ).toBeVisible();
  });

  test("member-facing program registration wizard enforces review acknowledgment", async ({
    page,
  }) => {
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

    await page.goto("/programs");
    await expect(page.getByRole("heading", { name: /programs/i })).toBeVisible({
      timeout: 10000,
    });

    const firstProgramCard = page.locator("a[href^=\"/programs/\"]").first();
    const hasPrograms = (await firstProgramCard.count()) > 0;
    if (!hasPrograms) {
      test.skip(true, "No member-visible programs found");
      return;
    }

    await firstProgramCard.click();
    await expect(page).toHaveURL(/\/programs\/[^/]+/);

    const registerButton = page.getByRole("link", {
      name: /register members|register now/i,
    });
    const canRegister = (await registerButton.count()) > 0;
    if (!canRegister) {
      test.skip(true, "Program is full or user already registered");
      return;
    }

    await registerButton.first().click();
    await expect(page).toHaveURL(/\/programs\/[^/]+\/register/);
    await expect(
      page.getByRole("heading", { name: /register for/i })
    ).toBeVisible({ timeout: 10000 });

    const continueFromMembersStep = page.getByRole("button", { name: /^continue$/i });
    await expect(continueFromMembersStep).toBeEnabled();
    await continueFromMembersStep.click();

    await expect(
      page.getByRole("heading", { name: /select events per registrant/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(
      page.getByRole("heading", { name: /review registration/i })
    ).toBeVisible();

    const finalizeButton = page.getByRole("button", {
      name: /continue to payment|complete registration/i,
    });
    await expect(finalizeButton).toBeDisabled();

    await page
      .getByLabel(/i confirm the selected registrants and event choices are correct/i)
      .check();
    await expect(finalizeButton).toBeEnabled();
  });
});
