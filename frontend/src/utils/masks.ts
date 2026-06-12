// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Remove tudo que não for dígito */
export const onlyDigits = (v: string) => v.replace(/\D/g, "");

// ─── CPF / CNPJ ──────────────────────────────────────────────────────────────

/** 000.000.000-00 */
export const maskCPF = (v: string): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

/** 00.000.000/0000-00 */
export const maskCNPJ = (v: string): string => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

/**
 * Escolhe CPF ou CNPJ automaticamente pelo número de dígitos.
 * ≤ 11 dígitos → CPF | 12–14 dígitos → CNPJ
 */
export const maskCpfCnpj = (v: string): string => {
  const d = onlyDigits(v);
  return d.length <= 11 ? maskCPF(d) : maskCNPJ(d);
};

// ─── Telefone ─────────────────────────────────────────────────────────────────

/**
 * Telefone brasileiro:
 *   10 dígitos → (00) 0000-0000  (fixo)
 *   11 dígitos → (00) 00000-0000 (celular)
 */
export const maskPhone = (v: string): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

// ─── Moeda ────────────────────────────────────────────────────────────────────

type Currency = "BRL" | "USD" | "EUR";

const CURRENCY_LOCALE: Record<Currency, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
};

/**
 * Formata valor como moeda (lógica de caixa registradora — entrada em centavos).
 *
 * Recebe a string RAW do input (pode ter máscara antiga) e devolve a nova
 * string formatada. O valor real (float) fica em `parseCurrency`.
 *
 * Exemplos:
 *   maskCurrency("12345", "BRL")  → "123,45"
 *   maskCurrency("1234567", "BRL") → "12.345,67"
 */
export const maskCurrency = (
  raw: string,
  currency: Currency = "BRL",
): string => {
  const digits = onlyDigits(raw);
  if (!digits) return "";

  const cents = parseInt(digits, 10);
  const amount = cents / 100;
  const locale = CURRENCY_LOCALE[currency] ?? "pt-BR";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Converte o valor mascarado de volta para `number` (float com 2 casas).
 * Retorna `undefined` se a string estiver vazia.
 *
 * Exemplos:
 *   parseCurrency("12.345,67") → 12345.67
 *   parseCurrency("1,234.56")  → 1234.56
 */
export const parseCurrency = (masked: string): number | undefined => {
  const digits = onlyDigits(masked);
  if (!digits) return undefined;
  return parseInt(digits, 10) / 100;
};

/**
 * Converte um `number` já salvo no estado para a string mascarada.
 * Útil para popular o display ao carregar dados existentes.
 *
 * Exemplo:
 *   currencyToDisplay(12345.67, "BRL") → "12.345,67"
 */
export const currencyToDisplay = (
  value: number | undefined,
  currency: Currency = "BRL",
): string => {
  if (value === undefined || value === null) return "";
  // Converte para centavos e passa pelo maskCurrency
  const cents = Math.round(value * 100);
  return maskCurrency(String(cents), currency);
};

// ─── CEP ─────────────────────────────────────────────────────────────────────

/** 00000-000 */
export const maskCEP = (v: string): string => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

/** DD/MM/AAAA */
export const maskDate = (v: string): string => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};
