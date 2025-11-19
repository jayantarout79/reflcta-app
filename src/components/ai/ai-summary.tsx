"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="card space-y-3 border border-[var(--color-primary)]/10 bg-gradient-to-br from-white via-white to-[var(--color-primary-soft)]/20 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">AI</p>
          <p className="text-lg font-semibold text-[var(--color-foreground)]">Situation summary</p>
        </div>
        <Button type="button" size="sm" onClick={handleClick} disabled={loading}>
          {loading ? (
            "Thinking..."
          ) : (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Generate
            </span>
          )}
        </Button>
      </div>
      {summary ? (
        <div className="prose prose-sm max-w-none text-[var(--color-foreground)]">
          <pre className="whitespace-pre-wrap">{summary}</pre>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          Provide fast executive insight across projects or clients.
        </p>
      )}
    </div>
  );
}
