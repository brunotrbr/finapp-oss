import { FinanceApiError } from "@/infrastructure/api/http-client";

export function fieldErrorFor<Field extends string>(
  reason: unknown,
  aliases: Record<string, Field>,
): { field: Field; message: string } | null {
  if (!(reason instanceof FinanceApiError)) return null;
  for (const [apiField, field] of Object.entries(aliases)) {
    const message = reason.fieldErrors[apiField]?.[0];
    if (message) return { field, message };
  }
  return null;
}
