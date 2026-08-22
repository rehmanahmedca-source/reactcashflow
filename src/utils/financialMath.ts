/**
 * Financial Math & Decimal Precision Engine
 * Prevents JavaScript floating-point errors by using integer minor-units (Paisa, 1 PKR = 100 Paisa).
 */

/**
 * Converts a PKR currency value (number or string) to integer Paisa.
 */
export function toPaisa(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer Paisa back to decimal PKR currency.
 */
export function fromPaisa(paisa: number): number {
  if (isNaN(paisa) || !isFinite(paisa)) return 0;
  return paisa / 100;
}

/**
 * Adds two currency amounts without floating-point drift.
 */
export function addMoney(a: number | string, b: number | string): number {
  return fromPaisa(toPaisa(a) + toPaisa(b));
}

/**
 * Subtracts b from a without floating-point drift.
 */
export function subMoney(a: number | string, b: number | string): number {
  return fromPaisa(toPaisa(a) - toPaisa(b));
}

/**
 * Formats a currency amount into standard Pakistan Rupee display: "Rs. 1,234.50" or "Rs. 1,234"
 */
export function formatPKR(val: number | string | undefined | null, includeDecimals: boolean = false): string {
  const num = typeof val === 'number' ? val : (val ? parseFloat(String(val).replace(/,/g, '')) : 0);
  if (isNaN(num)) return 'Rs. 0';

  return `Rs. ${num.toLocaleString('en-PK', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formats a number with commas without the "Rs." prefix.
 */
export function formatNumber(val: number | string | undefined | null): string {
  const num = typeof val === 'number' ? val : (val ? parseFloat(String(val).replace(/,/g, '')) : 0);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-PK', { maximumFractionDigits: 2 });
}
