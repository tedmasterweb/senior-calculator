"use client";

import { useState, useCallback } from "react";
import Calculator from "@/components/Calculator";
import HistoryPanel from "@/components/HistoryPanel";

/**
 * Main page — integrates the Calculator and HistoryPanel components.
 * The Calculator produces results that can be saved to the HistoryPanel.
 * History entries can be replayed back into the Calculator.
 */
export default function Home() {
  const [lastExpression, setLastExpression] = useState<string | undefined>(undefined);
  const [lastResult, setLastResult] = useState<string | undefined>(undefined);
  const [replayExpression, setReplayExpression] = useState<{ expression: string; result: string } | null>(null);

  const handleResult = useCallback((expression: string, result: string) => {
    // Don't save error results to history
    if (/error/i.test(result)) return;
    setLastExpression(expression);
    setLastResult(result);
  }, []);

  const handleReplay = useCallback((expression: string, result: string) => {
    setReplayExpression({ expression, result });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        Senior Calculator
      </h1>
      <div className="w-full max-w-md">
        <Calculator onResult={handleResult} loadExpression={replayExpression} />
        <HistoryPanel
          lastExpression={lastExpression}
          lastResult={lastResult}
          onReplay={handleReplay}
        />
      </div>
    </main>
  );
}
