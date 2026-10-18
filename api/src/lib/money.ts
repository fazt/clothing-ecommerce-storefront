/** Montos: la base guarda Decimal(10,2); los cálculos se hacen SIEMPRE en centavos enteros. */

export const toCents = (value: unknown): number => Math.round(Number(value ?? 0) * 100);

export const fromCents = (cents: number): string => (cents / 100).toFixed(2);
