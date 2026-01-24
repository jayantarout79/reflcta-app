import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    process.env[key] = rest.join("=").trim();
  }
}

function normalizeSynonyms(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function run() {
  loadDotEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to generate semantic.json",
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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
    throw new Error(
      `Failed to fetch metadata: ${knowledge.error?.message ?? ""} ${joins.error?.message ?? ""}`,
    );
  }

  const columnsByTable = {};
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

  const joinRows = (joins.data ?? []).map((row) => ({
    leftTable: row.left_table,
    rightTable: row.right_table,
    leftColumn: row.left_column,
    rightColumn: row.right_column,
    joinType: row.join_type,
    description: row.description,
  }));

  const catalog = {
    tables: Object.keys(columnsByTable).sort(),
    columns: columnsByTable,
    joins: joinRows,
    generatedAt: new Date().toISOString(),
  };

  const outputPath = path.join(process.cwd(), "public", "semantic.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));

  console.log(`semantic.json generated at ${outputPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
