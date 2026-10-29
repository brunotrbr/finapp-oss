import { describe, expect, it } from "vitest";
import { monthKey, monthLabel, shiftMonthKey } from "./period";

describe("períodos financeiros", () => {
  it("deriva o mês atual e anterior sem datas demonstrativas", () => {
    expect(monthKey(new Date(2031, 0, 15))).toBe("2031-01");
    expect(shiftMonthKey("2031-01", -1)).toBe("2030-12");
    expect(monthLabel("2031-01")).toMatch(/janeiro.*2031/i);
  });
});
