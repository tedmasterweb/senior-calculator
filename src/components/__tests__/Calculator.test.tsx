import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Calculator from "@/components/Calculator";

// Mock matchMedia for components that might use it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Helper: get operator/equals buttons by their accessible names
const getAddBtn = () => screen.getByRole("button", { name: "Add" });
const getSubtractBtn = () => screen.getByRole("button", { name: "Subtract" });
const getMultiplyBtn = () => screen.getByRole("button", { name: "Multiply" });
const getDivideBtn = () => screen.getByRole("button", { name: "Divide" });
const getEqualsBtn = () => screen.getByRole("button", { name: "Equals" });
const getClearBtn = () => screen.getByRole("button", { name: /clear/i });
const getDigitBtn = (d: string) => screen.getByRole("button", { name: new RegExp(`^${d}$`) });

describe("Calculator Component", () => {
  describe("AC-3: Large, High-Contrast UI", () => {
    test("renders all number buttons 0-9", () => {
      render(<Calculator />);
      for (let i = 0; i <= 9; i++) {
        expect(getDigitBtn(String(i))).toBeInTheDocument();
      }
    });

    test("renders operator buttons (+, −, ×, ÷)", () => {
      render(<Calculator />);
      expect(getAddBtn()).toBeInTheDocument();
      expect(getSubtractBtn()).toBeInTheDocument();
      expect(getMultiplyBtn()).toBeInTheDocument();
      expect(getDivideBtn()).toBeInTheDocument();
    });

    test("renders equals button", () => {
      render(<Calculator />);
      expect(getEqualsBtn()).toBeInTheDocument();
    });

    test("buttons have large text classes for accessibility", () => {
      render(<Calculator />);
      const button = getDigitBtn("5");
      // Buttons should have large font (text-3xl = 1.875rem in Tailwind)
      expect(button.className).toContain("text-3xl");
    });
  });

  describe("AC-4: Clear Display", () => {
    test("display shows initial value of 0", () => {
      render(<Calculator />);
      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveTextContent("0");
    });

    test("display updates when a number is entered", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(getDigitBtn("5"));

      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveTextContent("5");
    });
  });

  describe("AC-12: Clear Function", () => {
    test("clear button resets display to 0", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(getDigitBtn("5"));
      await user.click(getClearBtn());

      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveTextContent("0");
    });

    test("clear button is present and accessible", () => {
      render(<Calculator />);
      expect(getClearBtn()).toBeInTheDocument();
    });
  });

  describe("AC-1: Calculations via UI", () => {
    test("performs addition and displays result", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(getDigitBtn("5"));
      await user.click(getAddBtn());
      await user.click(getDigitBtn("3"));
      await user.click(getEqualsBtn());

      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveTextContent("8");
    });

    test("performs subtraction and displays result", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(getDigitBtn("9"));
      await user.click(getSubtractBtn());
      await user.click(getDigitBtn("4"));
      await user.click(getEqualsBtn());

      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveTextContent("5");
    });

    test("division by zero shows error message", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(getDigitBtn("1"));
      await user.click(getDigitBtn("0"));
      await user.click(getDivideBtn());
      await user.click(getDigitBtn("0"));
      await user.click(getEqualsBtn());

      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveTextContent(/error/i);
    });
  });

  describe("AC-2: Precision display via UI", () => {
    test("displays 8-decimal precision for division results", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(getDigitBtn("1"));
      await user.click(getDivideBtn());
      await user.click(getDigitBtn("3"));
      await user.click(getEqualsBtn());

      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveTextContent("0.33333333");
    });
  });

  describe("AC-13: Accessibility", () => {
    test("display has an accessible label and aria-live", () => {
      render(<Calculator />);
      const display = screen.getByTestId("calculator-display");
      expect(display).toHaveAttribute("aria-live", "polite");
      expect(display).toHaveAttribute("aria-label");
    });

    test("all buttons have accessible names", () => {
      render(<Calculator />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn).toHaveAccessibleName();
      });
    });
  });
});
