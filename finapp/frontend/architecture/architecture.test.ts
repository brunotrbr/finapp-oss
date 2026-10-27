// @vitest-environment node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const fromRoot = (...segments: string[]) => join(root, ...segments);

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(ts|tsx)$/.test(entry)
        ? [path]
        : [];
  });
}

describe("architecture boundaries", () => {
  it("keeps replaced presentation files in the historical mirror", () => {
    const archiveRoot = fromRoot("..", "older_screens");
    const required = [
      "README.md",
      "frontend/app/globals.css",
      "frontend/app/login/page.tsx",
      "frontend/features/auth/login-form.tsx",
      "frontend/features/finance/overview/overview.tsx",
      "frontend/features/finance/accounts/account-detail.tsx",
      "frontend/features/finance/transactions/transaction-form.tsx",
      "frontend/features/settings/category-settings.tsx",
    ];

    expect(required.filter((path) => !existsSync(join(archiveRoot, path)))).toEqual([]);
  });

  it("organizes product behavior in vertical slices", () => {
    const required = [
      "domain/finance/finance-reducer.ts",
      "features/finance/model/finance-context.tsx",
      "features/finance/accounts/account-detail.tsx",
      "features/finance/transactions/transaction-detail.tsx",
      "features/finance/bills/bill-detail.tsx",
      "features/finance/cards/card-detail.tsx",
      "features/finance/purchases/purchase-detail.tsx",
      "features/settings/settings-list.tsx",
      "features/auth/login-form.tsx",
      "features/dashboard-shell/dashboard-shell.tsx",
      "shared/ui/confirm-button.tsx",
      "infrastructure/firebase/client.ts",
      "infrastructure/auth/session.ts",
    ];
    const legacy = [
      "app/dashboard/_components/accounts-screens.tsx",
      "app/dashboard/_components/bills-screens.tsx",
      "app/dashboard/_components/cards-screens.tsx",
      "app/dashboard/_components/settings-screens.tsx",
      "app/dashboard/_state/finance-reducer.ts",
    ];

    expect(required.filter((path) => !existsSync(fromRoot(path)))).toEqual([]);
    expect(legacy.filter((path) => existsSync(fromRoot(path)))).toEqual([]);
  });

  it("keeps the finance domain independent from frameworks and outer layers", () => {
    const domainRoot = fromRoot("domain", "finance");
    const forbidden = /from\s+["'](?:react|next(?:\/|["'])|firebase|@\/(?:app|features|shared|infrastructure)(?:\/|["']))/;
    const violations = sourceFiles(domainRoot).flatMap((file) => {
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      return lines
        .map((line, index) => ({ file: relative(root, file), line: index + 1, source: line.trim() }))
        .filter(({ source }) => forbidden.test(source));
    });

    expect(violations).toEqual([]);
  });
});
