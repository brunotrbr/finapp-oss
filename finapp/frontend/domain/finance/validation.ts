export const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

export function requiredError(value: string) {
  return normalizeSpaces(value) ? null : "Este campo é obrigatório.";
}

export function positiveAmountError(value: number) {
  return Number.isFinite(value) && value > 0 ? null : "Informe um valor maior que zero.";
}

export function dayError(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 31 ? null : "Informe um dia inteiro entre 1 e 31.";
}

export function installmentsError(value: number) {
  return Number.isInteger(value) && value > 0 ? null : "Informe uma quantidade inteira maior que zero.";
}

export function categoryError(value: string, categories: string[]) {
  const normalized = normalizeSpaces(value);
  if (!normalized) return "Informe o nome da categoria.";
  return categories.some((category) => category.toLocaleLowerCase("pt-BR") === normalized.toLocaleLowerCase("pt-BR"))
    ? "Esta categoria já existe."
    : null;
}
