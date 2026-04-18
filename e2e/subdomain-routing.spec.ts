import { test, expect } from "@playwright/test";

import {
  buildRootUrl,
  buildTenantUrl,
  extractSubdomain,
  isLocalDomain,
  isReservedSubdomain,
  isTenantSubdomain,
} from "../lib/utils/subdomain";

/**
 * Subdomain routing smoke. Covers two surfaces:
 *
 *   1. Pure unit behavior of lib/utils/subdomain. Playwright doubles as a
 *      test runner here because the repo doesn't have vitest configured.
 *      These tests don't need a browser - they pin the host-parsing
 *      contract the middleware depends on.
 *
 *   2. A browser-driven check that the unknown-tenant page renders
 *      deterministically when visited on the root host. The full
 *      cross-subdomain e2e (bogus.localhost:3000 -> unknown-tenant,
 *      tenantA admin blocked on tenantB host) requires wildcard DNS
 *      plus seeded clubs; those are gated behind TENANT_A/TENANT_B
 *      env vars and skipped by default so CI stays green.
 */

test.describe("subdomain helpers (unit)", () => {
  test("extractSubdomain pulls a tenant prefix from a multi-tenant host", () => {
    expect(extractSubdomain("eastside-fc.loople.app", "loople.app")).toBe(
      "eastside-fc"
    );
    expect(
      extractSubdomain("eastside-fc.localhost:3000", "localhost:3000")
    ).toBe("eastside-fc");
  });

  test("extractSubdomain returns null for the apex host", () => {
    expect(extractSubdomain("loople.app", "loople.app")).toBeNull();
    expect(extractSubdomain("localhost:3000", "localhost:3000")).toBeNull();
  });

  test("extractSubdomain rejects multi-label subdomains", () => {
    expect(extractSubdomain("a.b.loople.app", "loople.app")).toBeNull();
  });

  test("extractSubdomain rejects IP literals and Vercel previews", () => {
    expect(extractSubdomain("127.0.0.1:3000", "localhost:3000")).toBeNull();
    expect(
      extractSubdomain("my-branch.vercel.app", "loople.app")
    ).toBeNull();
  });

  test("reserved subdomains do not count as tenants", () => {
    expect(isReservedSubdomain("www")).toBe(true);
    expect(isReservedSubdomain("admin")).toBe(true);
    expect(isTenantSubdomain("www")).toBe(false);
    expect(isTenantSubdomain("eastside-fc")).toBe(true);
    expect(isTenantSubdomain("invalid_chars")).toBe(false);
  });

  test("isLocalDomain flags localhost variants", () => {
    expect(isLocalDomain("localhost:3000")).toBe(true);
    expect(isLocalDomain("loople.app")).toBe(false);
  });

  test("buildTenantUrl joins host + path with the right protocol", () => {
    expect(
      buildTenantUrl("eastside-fc", "loople.app", "/admin")
    ).toBe("https://eastside-fc.loople.app/admin");
    expect(
      buildTenantUrl("eastside-fc", "localhost:3000", "/admin")
    ).toBe("http://eastside-fc.localhost:3000/admin");
  });

  test("buildRootUrl prefers www on prod, bare host on local", () => {
    expect(buildRootUrl("loople.app", "/auth/login")).toBe(
      "https://www.loople.app/auth/login"
    );
    expect(buildRootUrl("localhost:3000", "/auth/login")).toBe(
      "http://localhost:3000/auth/login"
    );
  });
});

test.describe("unknown-tenant route", () => {
  test("renders the fallback page on the root host", async ({ page }) => {
    await page.goto("/unknown-tenant");
    await expect(
      page.getByRole("heading", { name: /tenant not found/i })
    ).toBeVisible();
  });
});

test.describe("cross-tenant isolation (requires seeded clubs)", () => {
  // These tests require:
  //   - NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true for the dev server
  //   - /etc/hosts entries for TENANT_A, TENANT_B, and "bogus" on
  //     *.localhost so Playwright can resolve the hosts
  //   - TEST_ADMIN_* creds for a user who admins TENANT_A only
  //
  // Leave them skipped in CI; run locally with pnpm e2e when validating
  // a subdomain change end to end.
  test.beforeEach(() => {
    const required = [
      process.env.TENANT_A,
      process.env.TENANT_B,
      process.env.TEST_ADMIN_EMAIL,
      process.env.TEST_ADMIN_PASSWORD,
    ];
    if (required.some((v) => !v)) {
      test.skip(
        true,
        "set TENANT_A, TENANT_B, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD to run"
      );
    }
  });

  test("bogus subdomain renders unknown-tenant", async ({ page }) => {
    await page.goto("http://bogus.localhost:3000/");
    await expect(
      page.getByRole("heading", { name: /not found|tenant/i })
    ).toBeVisible();
  });

  test("admin of tenant A cannot reach tenant B admin", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL!;
    const password = process.env.TEST_ADMIN_PASSWORD!;
    const tenantA = process.env.TENANT_A!;
    const tenantB = process.env.TENANT_B!;

    await page.goto(`http://${tenantA}.localhost:3000/auth/login`);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/admin|\/$/);

    await page.goto(`http://${tenantB}.localhost:3000/admin`);
    // Expect to be bounced off admin (either to the tenant home or to
    // not-a-member); the only invariant is that we did NOT land on the
    // admin dashboard of tenant B.
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});
