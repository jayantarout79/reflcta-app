import { promises as fs } from "fs";
import path from "path";
import type { SemanticCatalog, SemanticColumn, SemanticJoin } from "./types";
import { getServiceRoleClient } from "@/lib/supabase/service";

const SEMANTIC_PATH = path.join(process.cwd(), "public", "semantic.json");

function normalizeSynonyms(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function loadSemanticCatalog(): Promise<SemanticCatalog | null> {
  try {
    const file = await fs.readFile(SEMANTIC_PATH, "utf-8");
    return JSON.parse(file) as SemanticCatalog;
  } catch (error) {
    return null;
  }
}

export async function writeSemanticCatalog(catalog: SemanticCatalog) {
  await fs.mkdir(path.dirname(SEMANTIC_PATH), { recursive: true });
  await fs.writeFile(SEMANTIC_PATH, JSON.stringify(catalog, null, 2));
}

export async function generateSemanticCatalog(): Promise<SemanticCatalog | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const [knowledge, joins] = await Promise.all([
    supabase
      .from("table_knowledge")
      .select(
        "table_name, column_name, synonyms, sample_value, description, field_type, aggregation_type",
      )
      .order("table_name")
      .order("column_name"),
    supabase
      .from("table_joins")
      .select(
        "left_table, right_table, left_column, right_column, join_type, description",
      )
      .order("left_table")
      .order("right_table"),
  ]);

  if (knowledge.error || joins.error) {
    console.error("Failed to load semantic metadata", {
      knowledgeError: knowledge.error,
      joinsError: joins.error,
    });
    return null;
  }

  const columnsByTable: Record<string, SemanticColumn[]> = {};
  for (const row of knowledge.data ?? []) {
    const table = String(row.table_name);
    const column = String(row.column_name);
    if (!columnsByTable[table]) columnsByTable[table] = [];
    columnsByTable[table].push({
      table,
      column,
      synonyms: normalizeSynonyms(row.synonyms),
      sampleValue: row.sample_value,
      description: row.description,
      fieldType: row.field_type,
      aggregationType: row.aggregation_type,
    });
  }

  const joinRows: SemanticJoin[] = (joins.data ?? []).map((row) => ({
    leftTable: row.left_table,
    rightTable: row.right_table,
    leftColumn: row.left_column,
    rightColumn: row.right_column,
    joinType: row.join_type,
    description: row.description,
  }));

  const tables = Object.keys(columnsByTable).sort();

  return {
    tables,
    columns: columnsByTable,
    joins: joinRows,
    generatedAt: new Date().toISOString(),
  } satisfies SemanticCatalog;
}

export async function getOrCreateSemanticCatalog() {
  const existing = await loadSemanticCatalog();
  if (existing) return existing;
  const generated = await generateSemanticCatalog();
  if (generated) {
    await writeSemanticCatalog(generated);
  }
  return generated;
}

export function getSemanticPath() {
  return SEMANTIC_PATH;
}
