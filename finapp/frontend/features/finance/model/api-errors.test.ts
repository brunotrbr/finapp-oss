import { describe, expect, it } from "vitest";
import { FinanceApiError } from "@/infrastructure/api/http-client";
import { fieldErrorFor } from "./api-errors";

describe("fieldErrorFor", () => {
  it("aceita apenas aliases conhecidos e mantém mensagens seguras", () => {
    const reason = new FinanceApiError(422, "validation_failed", false, {
      initialBalanceCents: ["Saldo fora do limite."],
      unsafe: ["Não exibir."],
    });

    expect(fieldErrorFor(reason, { initialBalanceCents: "initialBalance" })).toEqual({
      field: "initialBalance",
      message: "Saldo fora do limite.",
    });
    expect(fieldErrorFor(reason, { name: "name" })).toBeNull();
  });
});
