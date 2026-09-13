import { calculate, formatResult } from "@/lib/calculator";

describe("Calculator logic", () => {
  describe("AC-1: Basic Arithmetic Operations", () => {
    test("adds two positive numbers correctly", () => {
      expect(calculate(5, 3, "+")).toBe(8);
    });

    test("subtracts two numbers correctly", () => {
      expect(calculate(10, 4, "−")).toBe(6);
    });

    test("multiplies two numbers correctly", () => {
      expect(calculate(7, 6, "×")).toBe(42);
    });

    test("divides two numbers correctly", () => {
      expect(calculate(20, 4, "÷")).toBe(5);
    });

    test("division by zero returns an error indicator", () => {
      expect(calculate(10, 0, "÷")).toBe("Error: Division by zero");
    });
  });

  describe("AC-2: Eight-Decimal Precision (via formatResult + calculate)", () => {
    test("rounds results to at most 8 decimal places", () => {
      // 1/3 = 0.33333333... → "0.33333333"
      const result = calculate(1, 3, "÷");
      expect(typeof result).toBe("number");
      expect(formatResult(result as number)).toBe("0.33333333");
    });

    test("does not add unnecessary trailing zeros", () => {
      const result = calculate(10, 4, "÷");
      expect(formatResult(result as number)).toBe("2.5");
    });

    test("preserves up to 8 decimal places when needed", () => {
      // 1/7 = 0.142857142857... → "0.14285714"
      const result = calculate(1, 7, "÷");
      expect(formatResult(result as number)).toBe("0.14285714");
    });

    test("handles results with exactly 8 decimal places (rounding)", () => {
      // 1/6 = 0.166666666... → "0.16666667"
      const result = calculate(1, 6, "÷");
      expect(formatResult(result as number)).toBe("0.16666667");
    });
  });

  describe("AC-2: formatResult edge cases", () => {
    test("formats a number with fewer than 8 decimals without trailing zeros", () => {
      expect(formatResult(3.5)).toBe("3.5");
    });

    test("formats a whole number without decimals", () => {
      expect(formatResult(42)).toBe("42");
    });

    test("formats a number with exactly 8 decimal places", () => {
      expect(formatResult(0.12345678)).toBe("0.12345678");
    });

    test("rounds numbers with more than 8 decimal places", () => {
      expect(formatResult(0.123456789)).toBe("0.12345679");
    });

    test("formats zero as '0'", () => {
      expect(formatResult(0)).toBe("0");
    });
  });

  describe("AC-1: Error handling", () => {
    test("calculate returns error string for division by zero, not a number", () => {
      const result = calculate(5, 0, "÷");
      expect(typeof result).toBe("string");
      expect(result).toBe("Error: Division by zero");
    });
  });
});
