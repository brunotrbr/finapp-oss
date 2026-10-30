import { afterEach, describe, expect, it, vi } from "vitest";
import { FinanceApiError, requestJson } from "./http-client";

describe("requestJson", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normaliza uma falha de rede sem expor a mensagem nativa", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch internal host")));

    await expect(requestJson("/api/v1/accounts", { getToken: async () => "token" }))
      .rejects.toMatchObject<Partial<FinanceApiError>>({ status: 0, code: "network_error", retryable: true });
  });

  it("envia PATCH e preserva erros seguros por campo", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: "validation_failed",
      errors: { name: ["Informe um nome."], unsafe: "ignorar" },
    }), { status: 422, headers: { "Content-Type": "application/problem+json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson("/api/v1/accounts/a", { method: "PATCH", body: { name: "" }, getToken: async () => "token" }))
      .rejects.toMatchObject({ status: 422, code: "validation_failed", fieldErrors: { name: ["Informe um nome."] } });
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/api/v1/accounts/a", expect.objectContaining({ method: "PATCH" }));
  });
});
