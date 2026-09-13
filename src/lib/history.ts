/**
 * History management — perpetual, named, searchable, replayable calculation history.
 * Persists to localStorage so entries survive app restarts.
 */

export interface HistoryEntry {
  name: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface HistoryManager {
  /** Saves a new entry. Throws if name is not unique. */
  save(name: string, expression: string, result: string): HistoryEntry;

  /** Retrieves an entry by name, or undefined if not found. */
  get(name: string): HistoryEntry | undefined;

  /** Returns all entries. */
  getAll(): HistoryEntry[];

  /** Searches entries by name or expression (case-insensitive, partial match). */
  search(query: string): HistoryEntry[];

  /** Deletes an entry by name. No-op if not found. */
  delete(name: string): void;

  /** Renames an entry. Throws if the new name is not unique. */
  rename(oldName: string, newName: string): void;
}

const STORAGE_KEY = "senior-calculator-history";

function loadEntries(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function persistEntries(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function createHistoryManager(): HistoryManager {
  let entries: HistoryEntry[] = loadEntries();

  return {
    save(name, expression, result): HistoryEntry {
      if (entries.some((e) => e.name === name)) {
        throw new Error(`History name "${name}" must be unique. Please choose a different name.`);
      }
      const entry: HistoryEntry = {
        name,
        expression,
        result,
        timestamp: Date.now(),
      };
      entries = [...entries, entry];
      persistEntries(entries);
      return entry;
    },

    get(name): HistoryEntry | undefined {
      return entries.find((e) => e.name === name);
    },

    getAll(): HistoryEntry[] {
      return [...entries];
    },

    search(query): HistoryEntry[] {
      const lower = query.toLowerCase();
      return entries.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          e.expression.toLowerCase().includes(lower) ||
          e.result.toLowerCase().includes(lower)
      );
    },

    delete(name): void {
      entries = entries.filter((e) => e.name !== name);
      persistEntries(entries);
    },

    rename(oldName, newName): void {
      if (entries.some((e) => e.name === newName)) {
        throw new Error(`History name "${newName}" must be unique. Please choose a different name.`);
      }
      entries = entries.map((e) =>
        e.name === oldName ? { ...e, name: newName } : e
      );
      persistEntries(entries);
    },
  };
}
