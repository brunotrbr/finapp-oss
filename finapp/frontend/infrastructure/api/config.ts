export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

export type FinanceDataSource = "api" | "demo";

export function getFinanceDataSource(
  value = process.env.NEXT_PUBLIC_FINAPP_DATA_SOURCE,
  environment = process.env.NODE_ENV,
): FinanceDataSource {
  const source = value?.trim() || "api";
  if (source !== "api" && source !== "demo") {
    throw new ApiConfigurationError("NEXT_PUBLIC_FINAPP_DATA_SOURCE deve ser demo ou api.");
  }
  if (source === "demo" && environment === "production") {
    throw new ApiConfigurationError("O modo demo não pode ser habilitado em produção.");
  }
  return source;
}

export function getApiBaseUrl(value = process.env.NEXT_PUBLIC_API_BASE_URL) {
  if (!value) throw new ApiConfigurationError("NEXT_PUBLIC_API_BASE_URL não foi configurada.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiConfigurationError("NEXT_PUBLIC_API_BASE_URL deve ser uma URL válida.");
  }
  if (!(["http:", "https:"] as string[]).includes(url.protocol) || url.username || url.password) throw new ApiConfigurationError("A URL da API deve usar HTTP(S) e não pode conter credenciais.");
  return url.toString().replace(/\/$/, "");
}
