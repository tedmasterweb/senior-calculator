import {
  type HistoryManager,
  createHistoryManager,
} from "@/lib/history";

// Mock localStorage for persistence tests
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

// Replace global localStorage
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("History Management", () => {
  let history: HistoryManager;

  beforeEach(() => {
    localStorageMock.clear();
    history = createHistoryManager();
  });

  describe("AC-5: Saving Calculations to History", () => {
    test("saves a calculation with a name, expression, result, and timestamp", () => {
      const entry = history.save("Monthly Budget", "100 + 200", "300");

      expect(entry.name).toBe("Monthly Budget");
      expect(entry.expression).toBe("100 + 200");
      expect(entry.result).toBe("300");
      expect(entry.timestamp).toBeDefined();
      expect(typeof entry.timestamp).toBe("number");
    });

    test("retrieves a saved entry by name", () => {
      history.save("Groceries", "50 + 30", "80");
      const entry = history.get("Groceries");

      expect(entry).toBeDefined();
      expect(entry?.name).toBe("Groceries");
      expect(entry?.expression).toBe("50 + 30");
      expect(entry?.result).toBe("80");
    });

    test("getAll returns all saved entries", () => {
      history.save("Calc 1", "1 + 1", "2");
      history.save("Calc 2", "2 + 2", "4");

      const all = history.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe("AC-6: Unique History Names", () => {
    test("rejects saving with a duplicate name", () => {
      history.save("My Calc", "1 + 1", "2");

      expect(() => {
        history.save("My Calc", "3 + 3", "6");
      }).toThrow(/unique/i);
    });

    test("accepts saving with a unique name", () => {
      history.save("My Calc", "1 + 1", "2");
      expect(() => {
        history.save("My Calc 2", "3 + 3", "6");
      }).not.toThrow();
    });
  });

  describe("AC-7: History Includes Timestamps", () => {
    test("each entry has a timestamp", () => {
      const before = Date.now();
      const entry = history.save("Timed Calc", "5 × 5", "25");
      const after = Date.now();

      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(after);
    });

    test("timestamp is preserved when retrieved", () => {
      const entry = history.save("Timed Calc 2", "10 - 3", "7");
      const retrieved = history.get("Timed Calc 2");

      expect(retrieved?.timestamp).toBe(entry.timestamp);
    });
  });

  describe("AC-8: Searching History", () => {
    beforeEach(() => {
      history.save("Monthly Budget", "100 + 200", "300");
      history.save("Grocery Total", "50 + 30", "80");
      history.save("Tax Estimate", "1000 × 0.15", "150");
    });

    test("searches by name and returns matching entries", () => {
      const results = history.search("Budget");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Monthly Budget");
    });

    test("searches by expression content", () => {
      const results = history.search("0.15");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Tax Estimate");
    });

    test("search is case-insensitive", () => {
      const results = history.search("budget");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Monthly Budget");
    });

    test("returns empty array when no matches found", () => {
      const results = history.search("Nonexistent");
      expect(results).toHaveLength(0);
    });

    test("search matches partial strings", () => {
      const results = history.search("Mon");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Monthly Budget");
    });
  });

  describe("AC-9: Replayable History", () => {
    test("get returns the full entry for replay (expression and result)", () => {
      history.save("Replayable", "42 × 2", "84");
      const entry = history.get("Replayable");

      expect(entry).toBeDefined();
      expect(entry?.expression).toBe("42 × 2");
      expect(entry?.result).toBe("84");
    });
  });

  describe("AC-10: History Persistence", () => {
    test("history survives creating a new manager instance", () => {
      history.save("Persistent Calc", "7 + 8", "15");

      // Simulate app restart by creating a new manager
      const newHistory = createHistoryManager();
      const entry = newHistory.get("Persistent Calc");

      expect(entry).toBeDefined();
      expect(entry?.name).toBe("Persistent Calc");
      expect(entry?.expression).toBe("7 + 8");
      expect(entry?.result).toBe("15");
    });

    test("multiple entries persist across restarts", () => {
      history.save("Calc A", "1 + 1", "2");
      history.save("Calc B", "2 + 2", "4");
      history.save("Calc C", "3 + 3", "6");

      const newHistory = createHistoryManager();
      expect(newHistory.getAll()).toHaveLength(3);
    });
  });

  describe("AC-11: Deleting History Entries", () => {
    test("deletes a specific entry by name", () => {
      history.save("To Delete", "1 + 1", "2");
      history.save("To Keep", "2 + 2", "4");

      history.delete("To Delete");

      expect(history.get("To Delete")).toBeUndefined();
      expect(history.get("To Keep")).toBeDefined();
    });

    test("deleting a non-existent entry does not throw", () => {
      expect(() => {
        history.delete("Nonexistent");
      }).not.toThrow();
    });

    test("remaining entries are unaffected after deletion", () => {
      history.save("A", "1 + 1", "2");
      history.save("B", "2 + 2", "4");
      history.save("C", "3 + 3", "6");

      history.delete("B");

      const all = history.getAll();
      expect(all).toHaveLength(2);
      expect(history.get("A")).toBeDefined();
      expect(history.get("C")).toBeDefined();
    });
  });

  describe("AC-14: History Name Editing", () => {
    test("renames an existing entry to a unique name", () => {
      history.save("Old Name", "1 + 1", "2");

      history.rename("Old Name", "New Name");

      expect(history.get("Old Name")).toBeUndefined();
      const entry = history.get("New Name");
      expect(entry).toBeDefined();
      expect(entry?.expression).toBe("1 + 1");
      expect(entry?.result).toBe("2");
    });

    test("rejects renaming to an existing name", () => {
      history.save("Name 1", "1 + 1", "2");
      history.save("Name 2", "2 + 2", "4");

      expect(() => {
        history.rename("Name 1", "Name 2");
      }).toThrow(/unique/i);
    });

    test("preserves expression, result, and timestamp after rename", () => {
      history.save("Original", "5 × 5", "25");
      const original = history.get("Original");

      history.rename("Original", "Renamed");
      const renamed = history.get("Renamed");

      expect(renamed?.expression).toBe(original?.expression);
      expect(renamed?.result).toBe(original?.result);
      expect(renamed?.timestamp).toBe(original?.timestamp);
    });
  });
});
