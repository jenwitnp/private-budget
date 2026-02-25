/**
 * Format a number as Thai currency with thousand separators
 * @param amount - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with thousand separators and decimal places
 *
 * @example
 * formatCurrency(4500) => "4,500.00"
 * formatCurrency(1234567.5, 0) => "1,234,568"
 * formatCurrency(999.9, 1) => "999.9"
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
