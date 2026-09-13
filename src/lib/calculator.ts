/**
 * Calculator logic — arithmetic operations with 8-decimal precision.
 */

export type Operator = "+" | "−" | "×" | "÷";

/**
 * Performs a calculation with two operands and an operator.
 * Returns a number for exact results or a string error message.
 */
export function calculate(
  a: number,
  b: number,
  op: Operator
): number | string {
  if (op === "÷" && b === 0) {
    return "Error: Division by zero";
  }

  let result: number;

  switch (op) {
    case "+":
      result = a + b;
      break;
    case "−":
      result = a - b;
      break;
    case "×":
      result = a * b;
      break;
    case "÷":
      result = a / b;
      break;
  }

  return result;
}

/**
 * Formats a number to at most 8 decimal places, removing trailing zeros.
 */
export function formatResult(value: number): string {
  if (Number.isNaN(value)) return "Error";
  if (!Number.isFinite(value)) return "Error";

  // Round to 8 decimal places
  const rounded = Math.round(value * 1e8) / 1e8;

  // Convert to string and remove unnecessary trailing zeros
  return String(rounded);
}
