import { describe, expect, it, vi } from "vitest";
import { submissionFor } from "./submission";

describe("submissionFor", () => {
  it("reutiliza a chave somente para o mesmo payload", () => {
    const createKey = vi.fn().mockReturnValueOnce("key-1").mockReturnValueOnce("key-2");
    const first = submissionFor(null, { amount: 10, description: "A" }, createKey);
    const retry = submissionFor(first, { amount: 10, description: "A" }, createKey);
    const changed = submissionFor(retry, { amount: 11, description: "A" }, createKey);

    expect(retry).toBe(first);
    expect(changed.key).toBe("key-2");
    expect(createKey).toHaveBeenCalledTimes(2);
  });
});
