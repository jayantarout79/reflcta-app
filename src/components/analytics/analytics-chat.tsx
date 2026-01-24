"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { AnalyticsResult } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Total revenue by product type",
  "How many orders are pending payment?",
  "Top 10 products by revenue",
  "Average unit price by product type",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: AnalyticsResult;
  clarifyingQuestion?: string;
  error?: string;
};

function toCsv(columns: string[], rows: Record<string, string | number | null>[]) {
  const escape = (value: string | number | null) => {
    if (value === null || value === undefined) return "";
    const raw = String(value);
    if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const header = columns.map(escape).join(",");
  const body = rows
    .map((row) => columns.map((column) => escape(row[column] ?? null)).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function AnalyticsChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flowExpanded, setFlowExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const latestMessage = messages[messages.length - 1];
  const latestTrace =
    (latestMessage?.result?.debug as { trace?: string[] } | undefined)?.trace ?? [];

  const handleAsk = async (prompt: string) => {
    if (!prompt.trim()) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setFlowExpanded(true);

    try {
      const response = await fetch("/api/analytics/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, includeDebug: true }),
      });

      const raw = await response.text();
      const payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "Unable to answer that question.";
        throw new Error(message);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload?.clarifyingQuestion
          ? "I need a bit more detail to answer that."
          : payload?.summary ?? "Here are the results.",
        result: payload?.columns ? payload : undefined,
        clarifyingQuestion: payload?.clarifyingQuestion,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setFlowExpanded(false);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I couldn't run that query.",
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      toast.error(assistantMessage.error ?? "Request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    void handleAsk(question);
    setQuestion("");
  };

  const handleRefreshKnowledge = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/analytics/semantic", { method: "POST" });
      const payload = response.ok ? await response.json() : await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error ?? "Unable to refresh knowledge. Check service role credentials.",
        );
      }
      toast.success("Knowledge refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const latestResult = latestMessage?.result;
  const csv = useMemo(() => {
    if (!latestResult) return "";
    return toCsv(latestResult.columns, latestResult.rows);
  }, [latestResult]);

  const handleCopy = async () => {
    if (!csv) return;
    await navigator.clipboard.writeText(csv);
    toast.success("Copied CSV to clipboard");
  };

  const handleDownload = () => {
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "analytics-results.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-5">
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Analytics Chat
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            Ask business questions in plain English
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            The assistant plans safe queries using your semantic catalog, validates them, and
            returns read-only results.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRefreshKnowledge()}
              disabled={isRefreshing}
              className={cn(
                "rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)] transition",
                isRefreshing && "opacity-60",
              )}
            >
              {isRefreshing ? "Refreshing…" : "Refresh Knowledge"}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => void handleAsk(example)}
                className="chip rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-strong)]"
              >
                {example}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about revenue, orders, or product performance..."
              className="flex-1"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold text-white transition",
                isLoading
                  ? "bg-[var(--color-primary)]/60"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-strong)]",
              )}
            >
              {isLoading ? "Analyzing…" : "Ask"}
            </button>
          </form>
        </div>

        <div className="card space-y-4 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Conversation
          </p>
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-6 text-sm text-[var(--color-muted)]">
              Ask a question to see results, summaries, and query reasoning.
            </div>
          )}
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl border p-4 text-sm",
                  message.role === "user"
                    ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] bg-white",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  {message.role === "user" ? "You" : "Analytics"}
                </p>
                <p className="mt-2 text-sm text-[var(--color-foreground)]">
                  {message.content}
                </p>
                {message.error && (
                  <p className="mt-2 text-xs text-[var(--color-danger)]">{message.error}</p>
                )}
                {message.clarifyingQuestion && (
                  <p className="mt-2 text-xs text-[var(--color-warning)]">
                    {message.clarifyingQuestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
              Flow
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-[var(--color-muted)] underline"
              onClick={() => setFlowExpanded((prev) => !prev)}
            >
              {flowExpanded ? "Hide" : "Show"}
            </button>
          </div>
          <div className="mt-4">
            <div className={cn("space-y-3", flowExpanded ? "block" : "hidden")}>
              {(isLoading
                ? [
                    { label: "Sending to model", status: "active" },
                    { label: "Planning/validating query", status: "pending" },
                    { label: "Running on Supabase", status: "pending" },
                    { label: "Summarizing results", status: "pending" },
                  ]
                : latestTrace.map((label) => ({ label, status: "done" as const }))).map(
                (item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-3 text-xs"
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-2.5 w-2.5 rounded-full",
                        item.status === "done"
                          ? "bg-[var(--color-success)]"
                          : item.status === "active"
                            ? "bg-[var(--color-primary)] animate-pulse"
                            : "bg-[var(--color-border-strong)]",
                      )}
                    />
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)]">{item.label}</p>
                      {item.status === "active" && (
                        <p className="text-[var(--color-muted)]">Working…</p>
                      )}
                      {item.status === "pending" && (
                        <p className="text-[var(--color-muted)]">Queued</p>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
            {!flowExpanded && (
              <p className="text-xs text-[var(--color-muted)]">
                {isLoading
                  ? "Working through: model → plan → Supabase → summary."
                  : latestTrace.length
                    ? "Flow complete. Expand to view steps."
                    : "Flow will appear when you run a query."}
              </p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Results
          </p>
          {isLoading && (
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]">
              Fetching results…
            </div>
          )}
          {!isLoading && !latestResult && (
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]">
              Results will appear here after a successful query.
            </div>
          )}
          {latestResult && (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {latestResult.summary}
                </p>
                {latestResult.explanation && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {latestResult.explanation}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
                <span>{latestResult.rowCount} rows</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]"
                  >
                    Copy CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]"
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                    <tr>
                      {latestResult.columns.map((column) => (
                        <th key={column} className="px-4 py-3">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {latestResult.rows.map((row, rowIndex) => (
                      <tr
                        key={`${rowIndex}-${row[latestResult.columns[0]] ?? "row"}`}
                        className="border-t border-[var(--color-border)]"
                      >
                        {latestResult.columns.map((column) => (
                          <td key={`${rowIndex}-${column}`} className="px-4 py-3">
                            {row[column] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-xs text-[var(--color-muted)]">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--color-foreground)]">
                  How I calculated this
                </summary>
                <div className="mt-2 space-y-3">
                  {latestResult.explanation && (
                    <p className="text-xs text-[var(--color-muted)]">
                      {latestResult.explanation}
                    </p>
                  )}
                  {latestResult.debug && (
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                        Debug
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap text-[0.7rem] text-[var(--color-foreground)]">
                        {JSON.stringify(
                          {
                            plan: latestResult.debug.plan,
                            sql: latestResult.debug.sql,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Chart suggestion
          </p>
          <p className="mt-3 text-sm text-[var(--color-foreground)]">
            {latestResult?.chartSuggestion
              ? `Recommended: ${latestResult.chartSuggestion}`
              : "Run a query to get a chart suggestion."}
          </p>
        </div>
      </section>
    </div>
  );
}
