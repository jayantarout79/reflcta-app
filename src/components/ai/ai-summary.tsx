"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export function AISummary({
  entityType,
  payload,
}: {
  entityType: "client" | "project";
  payload: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setSummary("");
    try {
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        body: JSON.stringify({ entityType, payload }),
      });
      if (!response.ok) throw new Error("Unable to generate summary");
      const json = await response.json();
      setSummary(json.summary);
    } catch (error) {
      console.error(error);
      toast.error("OpenAI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-500">AI</p>
          <p className="text-sm font-semibold text-emerald-800">Situation summary</p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Thinking..." : "Generate"}
        </button>
      </div>
      {summary ? (
        <div className="prose prose-sm max-w-none text-emerald-900">
          <pre className="whitespace-pre-wrap">{summary}</pre>
        </div>
      ) : (
        <p className="text-sm text-emerald-800">
          Provide fast executive insight across projects or clients.
        </p>
      )}
    </div>
  );
}
