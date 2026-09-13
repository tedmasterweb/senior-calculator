"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { calculate, formatResult, type Operator } from "@/lib/calculator";

/**
 * Senior-friendly calculator with large, high-contrast buttons.
 * Supports keyboard navigation and screen reader announcements.
 */
export default function Calculator({
  onResult,
  loadExpression,
}: {
  /** Called when a calculation is completed, providing the expression and result. */
  onResult?: (expression: string, result: string) => void;
  /** When set, loads this expression into the display (for replay). */
  loadExpression?: { expression: string; result: string } | null;
}) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastExpression, setLastExpression] = useState("");

  // Handle replay from history
  const loadedRef = useRef<string | null>(null);
  if (loadExpression && loadedRef.current !== loadExpression.expression) {
    loadedRef.current = loadExpression.expression;
    setDisplay(loadExpression.result);
    setLastExpression(loadExpression.expression);
  }

  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (waitingForOperand) {
          setWaitingForOperand(false);
          return digit;
        }
        if (prev === "0") return digit;
        if (prev === "Error: Division by zero") return digit;
        return prev + digit;
      });
    },
    [waitingForOperand]
  );

  const inputDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return "0.";
      }
      if (prev.includes(".")) return prev;
      if (prev === "Error: Division by zero") return "0.";
      return prev + ".";
    });
  }, [waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setLastExpression("");
  }, []);

  const performOperation = useCallback(
    (nextOperator: Operator) => {
      const inputValue = parseFloat(display);

      if (previousValue !== null && operator && !waitingForOperand) {
        const result = calculate(previousValue, inputValue, operator);
        if (typeof result === "string") {
          setDisplay(result);
          setPreviousValue(null);
          setOperator(null);
          setWaitingForOperand(false);
          return;
        }
        const formatted = formatResult(result);
        setDisplay(formatted);
        setPreviousValue(result);
      } else {
        setPreviousValue(inputValue);
      }

      setOperator(nextOperator);
      setWaitingForOperand(true);
    },
    [display, previousValue, operator, waitingForOperand]
  );

  const handleEquals = useCallback(() => {
    if (previousValue === null || operator === null) return;

      const inputValue = parseFloat(display);
      const expression = `${formatResult(previousValue)} ${operator} ${display}`;
      const result = calculate(previousValue, inputValue, operator);

      if (typeof result === "string") {
        setDisplay(result);
      } else {
        const formatted = formatResult(result);
        setDisplay(formatted);
        setLastExpression(expression);
        if (onResult) {
          onResult(expression, formatted);
        }
      }

      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(false);
    },
    [display, previousValue, operator, onResult]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key >= "0" && e.key <= "9") {
        inputDigit(e.key);
      } else if (e.key === ".") {
        inputDecimal();
      } else if (e.key === "+") {
        performOperation("+");
      } else if (e.key === "-") {
        performOperation("−");
      } else if (e.key === "*") {
        performOperation("×");
      } else if (e.key === "/") {
        e.preventDefault();
        performOperation("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
        clear();
      }
    },
    [inputDigit, inputDecimal, performOperation, handleEquals, clear]
  );

  // Button styling — large, high-contrast for senior users
  const buttonClass =
    "text-3xl font-bold rounded-xl transition-all focus:outline-none focus:ring-4 " +
    "focus:ring-blue-400 focus:ring-offset-2 min-h-[80px] min-w-[80px] " +
    "active:scale-95 hover:brightness-110 select-none";

  const numberClass =
    buttonClass + " bg-blue-600 text-white hover:bg-blue-500";

  const operatorClass =
    buttonClass + " bg-amber-500 text-white hover:bg-amber-400";

  const equalsClass =
    buttonClass + " bg-green-600 text-white hover:bg-green-500";

  const clearClass =
    buttonClass + " bg-red-600 text-white hover:bg-red-500";

  const decimalClass = numberClass;

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Calculator"
      className="bg-slate-900 p-6 rounded-2xl max-w-md mx-auto"
      data-testid="calculator"
    >
      {/* Display */}
      <div
        data-testid="calculator-display"
        aria-live="polite"
        aria-label="Calculator display"
        className="bg-black text-green-300 text-5xl font-mono font-bold text-right p-6 rounded-xl mb-6 min-h-[100px] flex items-center justify-end overflow-hidden"
      >
        {display}
      </div>

      {/* Button grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Row 1: Clear */}
        <button
          type="button"
          className={clearClass + " col-span-2"}
          onClick={clear}
          aria-label="Clear calculator"
        >
          C
        </button>
        <button
          type="button"
          className={operatorClass}
          onClick={() => performOperation("÷")}
          aria-label="Divide"
        >
          ÷
        </button>
        <button
          type="button"
          className={operatorClass}
          onClick={() => performOperation("×")}
          aria-label="Multiply"
        >
          ×
        </button>

        {/* Row 2: 7 8 9 − */}
        <button type="button" className={numberClass} onClick={() => inputDigit("7")}>
          7
        </button>
        <button type="button" className={numberClass} onClick={() => inputDigit("8")}>
          8
        </button>
        <button type="button" className={numberClass} onClick={() => inputDigit("9")}>
          9
        </button>
        <button
          type="button"
          className={operatorClass}
          onClick={() => performOperation("−")}
          aria-label="Subtract"
        >
          −
        </button>

        {/* Row 3: 4 5 6 + */}
        <button type="button" className={numberClass} onClick={() => inputDigit("4")}>
          4
        </button>
        <button type="button" className={numberClass} onClick={() => inputDigit("5")}>
          5
        </button>
        <button type="button" className={numberClass} onClick={() => inputDigit("6")}>
          6
        </button>
        <button
          type="button"
          className={operatorClass}
          onClick={() => performOperation("+")}
          aria-label="Add"
        >
          +
        </button>

        {/* Row 4: 1 2 3 = */}
        <button type="button" className={numberClass} onClick={() => inputDigit("1")}>
          1
        </button>
        <button type="button" className={numberClass} onClick={() => inputDigit("2")}>
          2
        </button>
        <button type="button" className={numberClass} onClick={() => inputDigit("3")}>
          3
        </button>
        <button
          type="button"
          className={equalsClass + " row-span-2"}
          onClick={handleEquals}
          aria-label="Equals"
        >
          =
        </button>

        {/* Row 5: 0 . */}
        <button
          type="button"
          className={numberClass + " col-span-2"}
          onClick={() => inputDigit("0")}
        >
          0
        </button>
        <button type="button" className={decimalClass} onClick={inputDecimal} aria-label="Decimal point">
          .
        </button>
      </div>

      {/* Last expression (hidden text for screen readers) */}
      {lastExpression && (
        <div className="sr-only" aria-label="Last calculation">
          {lastExpression}
        </div>
      )}
    </div>
  );
}
