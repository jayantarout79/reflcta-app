import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { getOrCreateSemanticCatalog } from "@/lib/analytics/semantic";
import { validatePlan } from "@/lib/analytics/validation";
import { compileSql } from "@/lib/analytics/sql";
import type { AnalyticsPlan, AnalyticsResult } from "@/lib/analytics/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MODEL = "gpt-4o-mini";
export const runtime = "nodejs";

function extractJson(text: string) {
  if (!text) return null;
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (error) {
    return null;
  }
}

function getResponsePayload(response: {
  output_text?: string[];
  output_parsed?: unknown[];
  output?: Array<{
    type?: string;
    text?: string;
    json?: unknown;
    parsed?: unknown;
    content?: Array<{ type?: string; text?: string; json?: unknown; parsed?: unknown }>;
  }>;
}) {
  const outputText = response.output_text?.[0];
  if (outputText) return outputText;
  if (response.output_parsed && response.output_parsed.length) {
    return response.output_parsed[0];
  }
  const output = response.output ?? [];
  for (const item of output) {
    if ("parsed" in item && item.parsed !== undefined) return item.parsed;
    if ("json" in item && item.json !== undefined) return item.json;
    if (item.text) return item.text;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const block of content) {
      if (block && "parsed" in block && block.parsed !== undefined) return block.parsed;
      if (block && "json" in block && block.json !== undefined) return block.json;
      if (block && "text" in block && block.text) return block.text;
    }
  }
  return null;
}

function buildPlanningPrompt(question: string, semantic: unknown) {
  return [
    {
      role: "system" as const,
      content:
        "You are a precise analytics planner. You must ONLY output JSON. Do not output SQL. Use only the provided semantic catalog. If the question is missing a required dimension or time range, set clarifyingQuestion and leave select empty.",
    },
    {
      role: "system" as const,
      content:
        "Intent rules: revenue/sales => sum(total_amount_inr) when available. top => order by desc + limit. trend => group by a date bucket if a date dimension exists. Use allowed aggregations only: sum, avg, count, percent.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({ question, semantic }, null, 2),
    },
    {
      role: "system" as const,
      content:
        "Return JSON with keys: question, tables, joins, select, filters, groupBy, orderBy, limit, derivedMetrics, chartSuggestion, clarifyingQuestion, queryDescription. Keep select empty if clarifyingQuestion is set.",
    },
  ];
}

function buildSummaryPrompt(question: string, rows: unknown[], columns: string[]) {
  return [
    {
      role: "system" as const,
      content:
        "You are an analytics assistant. Summarize results in 1-3 plain sentences. Do NOT reply with only a number; name the metric(s) and values (e.g., 'Total revenue was 12.3K' or 'Average order value is 520'). Be factual and concise.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({ question, columns, rows }, null, 2),
    },
  ];
}

type DirectSqlPlan = {
  sql?: string;
  columns?: string[];
  chartSuggestion?: "bar" | "line" | "table" | null;
  clarifyingQuestion?: string | null;
  description?: string | null;
};

function buildDirectSqlPrompt(question: string, semantic: unknown) {
  return [
    {
      role: "system" as const,
      content:
        "You are a SQL generator. Use ONLY the provided semantic catalog tables/columns. Avoid sensitive data. Output a single, safe SELECT statement. Do not include multiple statements or DDL/DML.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({ question, semantic }, null, 2),
    },
    {
      role: "system" as const,
      content:
        "Return JSON with keys: sql (string), columns (array of strings for expected output columns), chartSuggestion (bar|line|table), clarifyingQuestion (string|null), description (string|null). If a clarifying question is needed, set clarifyingQuestion and leave sql empty.",
    },
  ];
}

function inferColumns(rows: unknown[], fallback: string[] = []) {
  if (fallback.length) return fallback;
  const first = rows.find((row) => row && typeof row === "object") as Record<string, unknown> | undefined;
  return first ? Object.keys(first) : [];
}

async function runDirectSql({
  client,
  question,
  semantic,
  includeDebug,
  trace,
  start,
}: {
  client: NonNullable<ReturnType<typeof getOpenAIClient>>;
  question: string;
  semantic: unknown;
  includeDebug: boolean;
  trace: string[];
  start: number;
}) {
  trace.push("Requesting direct SQL from model");
  const directPrompt = buildDirectSqlPrompt(question, semantic);
  const directResponse = await client.responses.create({
    model: MODEL,
    input: directPrompt,
  });

  const directPayload = getResponsePayload(directResponse);
  const directJson =
    directPayload && typeof directPayload === "object"
      ? directPayload
      : typeof directPayload === "string"
        ? extractJson(directPayload)
        : null;
  const directPlan = directJson as DirectSqlPlan | null;

  if (!directPlan) {
    console.warn("Direct SQL plan parse failed", {
      rawType: typeof directPayload,
      rawSample: typeof directPayload === "string" ? directPayload.slice(0, 200) : directPayload,
    });
    trace.push("Fallback to chat.completions direct SQL");
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: directPrompt as Array<{ role: "system" | "user" | "assistant"; content: string }>,
      response_format: { type: "json_object" },
    });
    const content = completion.choices?.[0]?.message?.content ?? "";
    const completionPlan = extractJson(content) as DirectSqlPlan | null;
    if (!completionPlan) {
      console.warn("Completion direct SQL parse failed", {
        rawSample: content.slice(0, 200),
      });
      return NextResponse.json(
        { error: "Unable to parse analytics plan." },
        { status: 400 },
      );
    }
    return runDirectSqlResult({
      plan: completionPlan,
      client,
      includeDebug,
      question,
      semantic,
      trace,
      start,
    });
  }

  return runDirectSqlResult({
    plan: directPlan,
    client,
    includeDebug,
    question,
    semantic,
    trace,
    start,
  });
}

async function runDirectSqlResult({
  plan,
  client,
  includeDebug,
  question,
  semantic,
  trace,
  start,
}: {
  plan: DirectSqlPlan;
  client: NonNullable<ReturnType<typeof getOpenAIClient>>;
  includeDebug: boolean;
  question: string;
  semantic: unknown;
  trace: string[];
  start: number;
}) {
  const directPlan = plan;
  if (directPlan.clarifyingQuestion) {
    return NextResponse.json({
      clarifyingQuestion: directPlan.clarifyingQuestion,
      debug: includeDebug ? { plan: directPlan as unknown as AnalyticsPlan, sql: "", trace } : undefined,
    });
  }

  const sql = (directPlan.sql ?? "").trim();
  if (!sql.toLowerCase().startsWith("select")) {
    return NextResponse.json(
      { error: "Only SELECT statements are allowed." },
      { status: 400 },
    );
  }
  if (sql.includes(";")) {
    return NextResponse.json(
      { error: "Multiple SQL statements are not allowed." },
      { status: 400 },
    );
  }

  trace.push("Executing direct SQL via Supabase RPC");
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client unavailable." },
      { status: 400 },
    );
  }

  const rpcResult = await supabase.rpc("execute_analytics_query", {
    sql_query: sql,
    sql_params: [],
  });
  if (rpcResult.error) {
    console.warn("Direct analytics RPC failed", rpcResult.error);
    return NextResponse.json(
      { error: "Analytics query failed on the server." },
      { status: 400 },
    );
  }

  const data = rpcResult.data as { rows?: unknown[]; row_count?: number } | null;
  const rows = Array.isArray(data?.rows) ? data?.rows : [];
  const rowCount = data?.row_count ?? rows.length ?? 0;
  const columns = inferColumns(rows, directPlan.columns ?? []);

  trace.push("Summarizing results with model");
  const summaryResponse = await client.responses.create({
    model: MODEL,
    input: buildSummaryPrompt(question, rows, columns),
  });
  const summaryText =
    summaryResponse.output_text?.[0] ??
    (summaryResponse.output?.[0]?.type === "message" &&
    "content" in summaryResponse.output?.[0]
      ? (summaryResponse.output?.[0]?.content?.[0] as { text?: string })?.text
      : undefined);

  const result: AnalyticsResult = {
    summary: summaryText ?? "Here are the results.",
    columns,
    rows,
    rowCount,
    chartSuggestion: directPlan.chartSuggestion ?? "table",
    explanation: directPlan.description ?? undefined,
    debug: includeDebug
      ? {
          plan: directPlan as unknown as AnalyticsPlan,
          sql,
          trace,
        }
      : undefined,
  };

  console.info("Direct analytics query complete", {
    durationMs: Date.now() - start,
    rowCount: result.rowCount,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const start = Date.now();
  const client = getOpenAIClient();
  const trace: string[] = [];
  if (!client) {
    return NextResponse.json(
      { error: "OpenAI key missing. Set OPENAI_API_KEY." },
      { status: 400 },
    );
  }

  const { question, includeDebug } = await request.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }
  trace.push("Received question");

  const semantic = await getOrCreateSemanticCatalog();
  if (!semantic) {
    return NextResponse.json(
      {
        error:
          "semantic.json is missing. Run: npm run generate:semantic before using analytics chat.",
      },
      { status: 400 },
    );
  }
  trace.push("Loaded semantic catalog");

  trace.push("Using direct SQL path");
  return runDirectSql({ client, question, semantic, includeDebug, trace, start });

  const plan = (Array.isArray(planJson) ? planJson[0] : planJson) as AnalyticsPlan;
  if (plan.clarifyingQuestion) {
    trace.push("Model requested clarification");
    return NextResponse.json({
      clarifyingQuestion: plan.clarifyingQuestion,
      debug: includeDebug ? { plan, sql: "", trace } : undefined,
    });
  }
  trace.push("Parsed analytics plan JSON");

  const validation = validatePlan(plan, semantic);
  if (!validation.valid) {
    console.warn("Analytics plan blocked", validation.reason);
    return NextResponse.json(
      { error: `I can't query that: ${validation.reason}` },
      { status: 400 },
    );
  }

  let compiled: ReturnType<typeof compileSql>;
  try {
    compiled = compileSql(plan, semantic);
  } catch (error) {
    console.warn("Analytics SQL compile failed", error);
    return NextResponse.json(
      { error: "Unable to compile a safe query for that request." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client unavailable." },
      { status: 400 },
    );
  }

  trace.push("Executing compiled SQL via Supabase RPC");
  const rpcPayload = {
    sql_query: compiled.sql,
    sql_params: compiled.params,
  };

  const rpcResult = await supabase.rpc("execute_analytics_query", rpcPayload);
  if (rpcResult.error) {
    console.warn("Analytics RPC failed", rpcResult.error);
    return NextResponse.json(
      { error: "Analytics query failed on the server." },
      { status: 400 },
    );
  }

  const data = rpcResult.data as { rows?: unknown[]; row_count?: number } | null;
  const rows = Array.isArray(data?.rows) ? data?.rows : [];
  const rowCount = data?.row_count ?? rows.length ?? 0;

  trace.push("Summarizing results with model");
  const summaryResponse = await client.responses.create({
    model: MODEL,
    input: buildSummaryPrompt(question, rows, compiled.columnAliases),
  });

  const summaryText =
    summaryResponse.output_text?.[0] ??
    (summaryResponse.output?.[0]?.type === "message" &&
    "content" in summaryResponse.output?.[0]
      ? (summaryResponse.output?.[0]?.content?.[0] as { text?: string })?.text
      : undefined);

  const result: AnalyticsResult = {
    summary: summaryText ?? "Here are the results.",
    columns: compiled.columnAliases,
    rows,
    rowCount,
    chartSuggestion: plan.chartSuggestion ?? "table",
    explanation: plan.queryDescription,
    debug: includeDebug
      ? {
          plan,
          sql: compiled.sql,
          trace,
        }
      : undefined,
  };

  console.info("Analytics query complete", {
    durationMs: Date.now() - start,
    rowCount: result.rowCount,
  });

  return NextResponse.json(result);
}
