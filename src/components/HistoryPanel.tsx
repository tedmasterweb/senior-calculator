"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createHistoryManager,
  type HistoryEntry,
  type HistoryManager,
} from "@/lib/history";

/**
 * History panel — displays saved calculations with search, replay, delete, and rename.
 * Persists to localStorage so entries survive app restarts.
 */
export default function HistoryPanel({
  lastExpression,
  lastResult,
  onReplay,
}: {
  lastExpression?: string;
  lastResult?: string;
  onReplay?: (expression: string, result: string) => void;
}) {
  const [manager] = useState<HistoryManager>(() => createHistoryManager());
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState("");

  // Renaming state
  const [renamingEntry, setRenamingEntry] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");

  // Load entries on mount
  useEffect(() => {
    setEntries(manager.getAll());
  }, [manager]);

  // Filter entries by search query
  const displayedEntries = searchQuery
    ? entries.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.result.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  const handleSaveClick = useCallback(() => {
    if (!lastExpression || !lastResult) return;
    setIsSaving(true);
    setSaveName("");
    setSaveError("");
  }, [lastExpression, lastResult]);

  const handleSaveConfirm = useCallback(() => {
    if (!lastExpression || !lastResult || !saveName.trim()) return;

    try {
      manager.save(saveName.trim(), lastExpression, lastResult);
      setEntries(manager.getAll());
      setIsSaving(false);
      setSaveName("");
      setSaveError("");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Name must be unique"
      );
    }
  }, [manager, saveName, lastExpression, lastResult]);

  const handleSaveCancel = useCallback(() => {
    setIsSaving(false);
    setSaveName("");
    setSaveError("");
  }, []);

  const handleDelete = useCallback(
    (name: string) => {
      manager.delete(name);
      setEntries(manager.getAll());
    },
    [manager]
  );

  const handleRenameStart = useCallback((entry: HistoryEntry) => {
    setRenamingEntry(entry.name);
    setRenameValue(entry.name);
    setRenameError("");
  }, []);

  const handleRenameConfirm = useCallback(
    (oldName: string) => {
      if (!renameValue.trim() || renameValue.trim() === oldName) {
        setRenamingEntry(null);
        return;
      }

      try {
        manager.rename(oldName, renameValue.trim());
        setEntries(manager.getAll());
        setRenamingEntry(null);
        setRenameValue("");
        setRenameError("");
      } catch (err) {
        setRenameError(
          err instanceof Error ? err.message : "Name must be unique"
        );
      }
    },
    [manager, renameValue]
  );

  const handleReplay = useCallback(
    (entry: HistoryEntry) => {
      if (onReplay) {
        onReplay(entry.expression, entry.result);
      }
    },
    [onReplay]
  );

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const hasResult = lastExpression !== undefined && lastResult !== undefined;

  return (
    <div
      className="bg-slate-800 text-white rounded-2xl p-6 max-w-md mx-auto mt-6"
      aria-label="Calculation history"
    >
      <h2 className="text-2xl font-bold mb-4" aria-label="History heading">
        History
      </h2>

      {/* Save button */}
      {hasResult && !isSaving && (
        <button
          type="button"
          onClick={handleSaveClick}
          className="w-full bg-purple-600 text-white text-xl font-bold py-4 rounded-xl mb-4 hover:bg-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all active:scale-95"
          aria-label="Save calculation to history"
        >
          Save to History
        </button>
      )}

      {/* Save form */}
      {isSaving && (
        <div className="bg-slate-700 p-4 rounded-xl mb-4">
          <label htmlFor="save-name" className="block text-lg font-bold mb-2">
            Name for this calculation
          </label>
          <input
            id="save-name"
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="w-full text-xl p-3 rounded-lg text-black"
            placeholder="Enter a unique name"
            aria-label="History entry name"
            autoFocus
          />
          {saveError && (
            <p className="text-red-300 text-base mt-2" role="alert">
              {saveError}
            </p>
          )}
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={handleSaveConfirm}
              className="flex-1 bg-green-600 text-white text-lg font-bold py-3 rounded-xl hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-300"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleSaveCancel}
              className="flex-1 bg-gray-600 text-white text-lg font-bold py-3 rounded-xl hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {entries.length > 0 && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          className="w-full text-lg p-3 rounded-lg text-black mb-4"
          aria-label="Search history"
        />
      )}

      {/* History list */}
      {entries.length === 0 ? (
        <p className="text-gray-400 text-lg text-center py-4">
          No saved calculations yet
        </p>
      ) : displayedEntries.length === 0 ? (
        <p className="text-gray-400 text-lg text-center py-4">
          No results found
        </p>
      ) : (
        <ul className="space-y-3 max-h-[500px] overflow-y-auto">
          {displayedEntries.map((entry) => (
            <li
              key={entry.name}
              data-testid="history-entry"
              className="bg-slate-700 p-4 rounded-xl cursor-pointer hover:bg-slate-600 transition-colors"
              onClick={() => !renamingEntry && handleReplay(entry)}
            >
              {renamingEntry === entry.name ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <label htmlFor={`rename-${entry.name}`} className="sr-only">
                    New name
                  </label>
                  <input
                    id={`rename-${entry.name}`}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full text-lg p-2 rounded-lg text-black"
                    aria-label="History entry name"
                    autoFocus
                  />
                  {renameError && (
                    <p className="text-red-300 text-base mt-1" role="alert">
                      {renameError}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleRenameConfirm(entry.name)}
                      className="flex-1 bg-green-600 text-white text-base font-bold py-2 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingEntry(null);
                        setRenameError("");
                      }}
                      className="flex-1 bg-gray-600 text-white text-base font-bold py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {entry.name}
                      </h3>
                      <p className="text-lg text-green-300 font-mono mt-1">
                        {entry.expression} = {entry.result}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameStart(entry);
                        }}
                        className="bg-blue-500 text-white text-base font-bold px-3 py-2 rounded-lg hover:bg-blue-400"
                        aria-label="Rename history entry"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.name);
                        }}
                        className="bg-red-500 text-white text-base font-bold px-3 py-2 rounded-lg hover:bg-red-400"
                        aria-label="Delete history entry"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
