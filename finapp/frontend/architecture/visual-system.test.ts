// @vitest-environment node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function relativeLuminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const [red, green, blue] = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function cssVariable(css: string, name: string) {
  const value = css.match(new RegExp(`--${name}:\\s*(#[\\da-f]{6})`, "i"))?.[1];
  if (!value) throw new Error(`Token CSS --${name} não encontrado.`);
  return value;
}

describe("OSS visual system", () => {
  it("defines the approved semantic palette and a light-only color scheme", () => {
    const css = source("app/globals.css");
    expect(css).toContain("--primary: #0f766e");
    expect(css).toContain("--secondary: #4338ca");
    expect(css).toContain("--tertiary: #c2410c");
    expect(css).toContain("--income: #15803d");
    expect(css).toContain("--expense: #b91c1c");
    expect(css).not.toContain("prefers-color-scheme: dark");
  });

  it("loads Plus Jakarta Sans through the root layout", () => {
    const layout = source("app/layout.tsx");
    expect(layout).toContain("Plus_Jakarta_Sans");
    expect(layout).toContain("--font-plus-jakarta");
  });

  it("keeps status codes and small text at WCAG AA contrast", () => {
    const css = source("app/globals.css");
    expect(contrast(cssVariable(css, "primary"), cssVariable(css, "background"))).toBeGreaterThanOrEqual(3);
    expect(contrast(cssVariable(css, "muted"), cssVariable(css, "surface"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(cssVariable(css, "on-primary"), cssVariable(css, "primary"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(cssVariable(css, "on-primary"), cssVariable(css, "on-primary-container"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(cssVariable(css, "on-primary"), cssVariable(css, "secondary"))).toBeGreaterThanOrEqual(4.5);

    expect(source("app/not-found.tsx")).toMatch(/className="[^"]*text-6xl[^"]*text-primary(?![-/])[^"]*"/);
    expect(source("features/settings/error-gallery.tsx")).toMatch(/className="[^"]*text-5xl[^"]*text-muted[^"]*"/);
    for (const path of [
      "features/finance/overview/overview.tsx",
      "features/finance/accounts/account-detail.tsx",
      "features/finance/cards/card-detail.tsx",
    ]) {
      expect(source(path)).not.toMatch(/text-on-primary\/\d+/);
    }
  });

  it("runs the E2E matrix serially against the controlled auth server", () => {
    const config = source("playwright.config.ts");
    expect(config).toContain("workers: 1");
    expect(config).toContain('command: "npm run dev -- --hostname 127.0.0.1 --port 3100"');
  });
});
