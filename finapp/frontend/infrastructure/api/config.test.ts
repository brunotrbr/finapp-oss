import { describe, expect, it } from "vitest";
import { getFinanceDataSource } from "./config";

describe("getFinanceDataSource", () => {
  it("uses the API by default", () => {
    expect(getFinanceDataSource(undefined, "development")).toBe("api");
  });

  it("allows the demo data source only outside production", () => {
    expect(getFinanceDataSource("demo", "development")).toBe("demo");
    expect(() => getFinanceDataSource("demo", "production")).toThrow(/produção/i);
  });

  it("rejects unknown values", () => {
    expect(() => getFinanceDataSource("memory", "development")).toThrow(/demo.*api/i);
  });
});
