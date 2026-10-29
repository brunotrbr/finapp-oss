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
});
