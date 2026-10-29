// @vitest-environment node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), "utf8");

describe("Stitch mobile-first screen map", () => {
  it("keeps every approved journey addressable through App Router", () => {
    const routes = [
      "app/login/page.tsx",
      "app/forgot-password/page.tsx",
      "app/reset-password/page.tsx",
      "app/dashboard/page.tsx",
      "app/dashboard/accounts/new/page.tsx",
      "app/dashboard/accounts/[accountId]/edit/page.tsx",
      "app/dashboard/accounts/[accountId]/page.tsx",
      "app/dashboard/transactions/new/page.tsx",
      "app/dashboard/cards/[cardId]/invoice/page.tsx",
      "app/dashboard/settings/categories/page.tsx",
      "app/dashboard/accounts/deletion-success/page.tsx",
    ];
    expect(routes.filter((path) => !existsSync(join(root, path)))).toEqual([]);
  });

  it("uses the current semantic palette instead of importing Stitch brand colors", () => {
    const css = source("app/globals.css").toLowerCase();
    expect(css).toContain("--primary: #0f766e");
    expect(css).toContain("--secondary: #4338ca");
    expect(css).toContain("--tertiary: #c2410c");
    for (const color of ["#00236f", "#1e3a8a", "#c5a059", "#fdfbf7"]) expect(css).not.toContain(color);
  });

  it("does not import prototype-only network UI or disable browser zoom", () => {
    const files = [
      "app/globals.css",
      "app/login/page.tsx",
      "features/finance/overview/overview.tsx",
      "features/finance/accounts/account-detail.tsx",
      "features/finance/transactions/transaction-form.tsx",
      "features/finance/cards/invoice-screen.tsx",
      "features/settings/category-settings.tsx",
    ];
    const combined = files.map(source).join("\n");
    expect(combined).not.toMatch(/material-symbols|fonts\.googleapis|user-scalable\s*=\s*no/i);
  });
});
