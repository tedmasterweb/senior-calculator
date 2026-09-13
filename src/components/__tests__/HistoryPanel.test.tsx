import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import HistoryPanel from "@/components/HistoryPanel";

// Mock matchMedia
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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Helpers
const getSaveBtn = () => screen.getByRole("button", { name: /save calculation/i });
const getSaveNameInput = () => screen.getByRole("textbox", { name: "History entry name" });
const getSaveConfirmBtn = () => {
  // When saving, the "Save" button is the confirm button
  const buttons = screen.getAllByRole("button", { name: "Save" });
  return buttons[0];
};
const getSearchInput = () => screen.getByPlaceholderText(/search/i);
const getRenameBtnFor = (entry: HTMLElement) =>
  within(entry).getByRole("button", { name: /rename history/i });
const getDeleteBtnFor = (entry: HTMLElement) =>
  within(entry).getByRole("button", { name: /delete history/i });
const getRenameInput = () => screen.getByRole("textbox", { name: "History entry name" });

describe("HistoryPanel Component", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("AC-5: Saving Calculations", () => {
    test("renders a save button when a result is available", () => {
      render(<HistoryPanel lastExpression="5 + 3" lastResult="8" />);

      expect(getSaveBtn()).toBeInTheDocument();
    });

    test("clicking save prompts for a name", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="5 + 3" lastResult="8" />);

      await user.click(getSaveBtn());

      expect(screen.getByRole("textbox", { name: "History entry name" })).toBeInTheDocument();
    });

    test("saving stores the entry with expression and result", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="5 + 3" lastResult="8" />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "My Calculation");
      await user.click(getSaveConfirmBtn());

      expect(screen.getByText("My Calculation")).toBeInTheDocument();
      // Expression and result are in the same paragraph
      const entry = screen.getByTestId("history-entry");
      expect(entry).toHaveTextContent("5 + 3");
      expect(entry).toHaveTextContent("8");
    });
  });

  describe("AC-6: Unique Names", () => {
    test("shows error when saving with duplicate name", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="5 + 3" lastResult="8" />);

      // Save first entry
      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Test Calc");
      await user.click(getSaveConfirmBtn());

      // Try to save with same name
      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Test Calc");
      await user.click(getSaveConfirmBtn());

      expect(screen.getByText(/unique/i)).toBeInTheDocument();
    });
  });

  describe("AC-7: Timestamps", () => {
    test("each history entry displays a timestamp", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Timestamped");
      await user.click(getSaveConfirmBtn());

      const entry = screen.getByTestId("history-entry");
      // Timestamp should show a date or time pattern
      expect(entry).toHaveTextContent(/\d{4}|\d{1,2}:\d{2}/);
    });
  });

  describe("AC-8: Searching History", () => {
    test("search input is present when entries exist", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Test");
      await user.click(getSaveConfirmBtn());

      expect(getSearchInput()).toBeInTheDocument();
    });

    test("searching filters entries by name", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      // Save first entry
      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Budget");
      await user.click(getSaveConfirmBtn());

      unmount();

      // Save second entry in a fresh render
      const { unmount: unmount2 } = render(<HistoryPanel lastExpression="2 + 2" lastResult="4" />);
      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Groceries");
      await user.click(getSaveConfirmBtn());

      // Search for "Budget"
      await user.type(getSearchInput(), "Budget");

      expect(screen.getByText("Budget")).toBeInTheDocument();
      expect(screen.queryByText("Groceries")).not.toBeInTheDocument();

      unmount2();
    });

    test("shows message when no results found", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Test");
      await user.click(getSaveConfirmBtn());

      await user.type(getSearchInput(), "Nonexistent");

      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });

  describe("AC-9: Replayable History", () => {
    test("clicking a history entry triggers replay callback", async () => {
      const user = userEvent.setup();
      const onReplay = jest.fn();
      render(<HistoryPanel lastExpression="42 × 2" lastResult="84" onReplay={onReplay} />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Replay Test");
      await user.click(getSaveConfirmBtn());

      // Click the entry name to replay
      await user.click(screen.getByText("Replay Test"));

      expect(onReplay).toHaveBeenCalledWith("42 × 2", "84");
    });
  });

  describe("AC-11: Deleting History Entries", () => {
    test("delete button removes an entry", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Delete Me");
      await user.click(getSaveConfirmBtn());

      const entry = screen.getByTestId("history-entry");
      await user.click(getDeleteBtnFor(entry));

      expect(screen.queryByText("Delete Me")).not.toBeInTheDocument();
    });
  });

  describe("AC-14: Renaming History Entries", () => {
    test("rename updates the entry name", async () => {
      const user = userEvent.setup();
      render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Old Name");
      await user.click(getSaveConfirmBtn());

      const entry = screen.getByTestId("history-entry");
      await user.click(getRenameBtnFor(entry));

      const nameInput = getRenameInput();
      await user.clear(nameInput);
      await user.type(nameInput, "New Name");

      // Click the "Save" button in the rename form
      const saveBtn = screen.getByRole("button", { name: "Save" });
      await user.click(saveBtn);

      expect(screen.getByText("New Name")).toBeInTheDocument();
      expect(screen.queryByText("Old Name")).not.toBeInTheDocument();
    });

    test("rename rejects duplicate names", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      // Save two entries
      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "First");
      await user.click(getSaveConfirmBtn());

      unmount();

      const { unmount: unmount2 } = render(<HistoryPanel lastExpression="2 + 2" lastResult="4" />);
      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Second");
      await user.click(getSaveConfirmBtn());

      // Try to rename "First" to "Second"
      const entries = screen.getAllByTestId("history-entry");
      const firstEntry = entries.find((e) => e.textContent?.includes("First"));
      expect(firstEntry).toBeDefined();

      await user.click(getRenameBtnFor(firstEntry!));
      const nameInput = getRenameInput();
      await user.clear(nameInput);
      await user.type(nameInput, "Second");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByText(/unique/i)).toBeInTheDocument();

      unmount2();
    });
  });

  describe("AC-10: History Persistence", () => {
    test("entries persist across remounts", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<HistoryPanel lastExpression="1 + 1" lastResult="2" />);

      await user.click(getSaveBtn());
      await user.type(getSaveNameInput(), "Persistent");
      await user.click(getSaveConfirmBtn());

      unmount();

      // Remount — entry should still be there
      render(<HistoryPanel />);
      expect(screen.getByText("Persistent")).toBeInTheDocument();
    });
  });
});
