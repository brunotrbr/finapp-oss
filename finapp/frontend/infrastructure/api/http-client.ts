import { getApiBaseUrl } from "./config";

export class FinanceApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(messageForStatus(status));
    this.name = "FinanceApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  getToken: () => Promise<string>;
};

const messageForStatus = (status: number) => {
  if (status === 0) return "Não foi possível conectar ao serviço financeiro. Verifique sua conexão e tente novamente.";
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403 || status === 404) return "O recurso solicitado não está disponível.";
  if (status === 429) return "Muitas tentativas. Aguarde e tente novamente.";
  return status >= 500 ? "O serviço financeiro está temporariamente indisponível." : "Não foi possível concluir a solicitação.";
};

const safeErrorDetails = async (response: Response) => {
  try {
    const value = await response.json() as { code?: unknown; errors?: unknown };
    const code = typeof value.code === "string" && /^[a-z0-9_.-]{1,80}$/i.test(value.code) ? value.code : `http_${response.status}`;
    const fieldErrors: Record<string, string[]> = {};
    if (value.errors && typeof value.errors === "object" && !Array.isArray(value.errors)) {
      for (const [field, messages] of Object.entries(value.errors)) {
        if (/^[a-z][a-z0-9.]{0,79}$/i.test(field) && Array.isArray(messages)) {
          const safe = messages.filter((message): message is string => typeof message === "string" && message.length <= 240);
          if (safe.length) fieldErrors[field] = safe;
        }
      }
    }
    return { code, fieldErrors };
  } catch {
    return { code: `http_${response.status}`, fieldErrors: {} };
  }
};

export async function requestJson(path: string, options: RequestOptions): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 10_000);
  const abort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abort, { once: true });

  try {
    const token = await options.getToken();
    if (!token) throw new FinanceApiError(401, "missing_token", false);
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const details = await safeErrorDetails(response);
      throw new FinanceApiError(response.status, details.code, response.status === 429 || response.status >= 500, details.fieldErrors);
    }
    return response.status === 204 ? undefined : response.json();
  } catch (reason) {
    if (reason instanceof FinanceApiError) throw reason;
    if (options.signal?.aborted) throw reason;
    throw new FinanceApiError(0, timedOut ? "timeout" : "network_error", true);
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abort);
  }
}
