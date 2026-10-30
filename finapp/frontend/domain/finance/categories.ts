export const FIXED_CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Trabalho",
  "Lazer",
  "Transferência",
  "Outros",
] as const;

export const SYSTEM_PAYMENT_CATEGORY = "Outros";

export function isFixedCategory(value: string) {
  return (FIXED_CATEGORIES as readonly string[]).includes(value);
}
