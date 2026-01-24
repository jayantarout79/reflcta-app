import type {
  AnalyticsPlan,
  SemanticCatalog,
  SemanticColumn,
} from "./types";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 50;
const SENSITIVE_PATTERNS = ["email", "phone", "address"];
const ALLOWED_AGGREGATIONS = new Set(["sum", "avg", "count", "percent"]);
const ALLOWED_OPERATORS = new Set(["=", "!=", ">", "<", ">=", "<=", "in", "like"]);

function findColumn(
  catalog: SemanticCatalog,
  table: string,
  column: string,
): SemanticColumn | null {
  const tableColumns = catalog.columns[table] ?? [];
  return tableColumns.find((entry) => entry.column === column) ?? null;
}

function isSensitive(columnName: string) {
  const normalized = columnName.toLowerCase();
  return SENSITIVE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function normalizePlanLimits(plan: AnalyticsPlan) {
  const limit = plan.limit ?? DEFAULT_LIMIT;
  if (Number.isNaN(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export function validatePlan(
  plan: AnalyticsPlan,
  catalog: SemanticCatalog,
): { valid: true } | { valid: false; reason: string } {
  if (!plan.select?.length) {
    return { valid: false, reason: "No columns selected." };
  }
  if (!plan.tables?.length) {
    return { valid: false, reason: "No tables specified." };
  }
  for (const table of plan.tables) {
    if (!catalog.tables.includes(table)) {
      return { valid: false, reason: `Table not allowed: ${table}` };
    }
  }

  const allSelects = [...(plan.select ?? [])];
  const derived = plan.derivedMetrics ?? [];

  for (const select of allSelects) {
    const column = findColumn(catalog, select.table, select.column);
    if (!column) {
      return { valid: false, reason: `Column not allowed: ${select.table}.${select.column}` };
    }
    if (isSensitive(select.column)) {
      return { valid: false, reason: `Sensitive column blocked: ${select.column}` };
    }
    if (select.aggregation) {
      if (select.aggregation === "percent") {
        return { valid: false, reason: "Percent must be a derived metric." };
      }
      if (!ALLOWED_AGGREGATIONS.has(select.aggregation)) {
        return { valid: false, reason: `Aggregation not allowed: ${select.aggregation}` };
      }
      if (column.fieldType !== "measure") {
        return { valid: false, reason: `Aggregation on dimension is not allowed: ${select.column}` };
      }
    } else if (column.fieldType === "measure") {
      return { valid: false, reason: `Measure requires aggregation: ${select.column}` };
    }
  }

  for (const metric of derived) {
    if (metric.type !== "percent") {
      return { valid: false, reason: "Only percent derived metrics are supported." };
    }
    const numerator = findColumn(catalog, metric.numerator.table, metric.numerator.column);
    const denominator = findColumn(
      catalog,
      metric.denominator.table,
      metric.denominator.column,
    );
    if (!numerator || !denominator) {
      return { valid: false, reason: "Derived metric uses invalid columns." };
    }
    if (numerator.fieldType !== "measure" || denominator.fieldType !== "measure") {
      return { valid: false, reason: "Derived metric must use measure columns." };
    }
  }

  for (const group of plan.groupBy ?? []) {
    const column = findColumn(catalog, group.table, group.column);
    if (!column) {
      return { valid: false, reason: `Group by not allowed: ${group.table}.${group.column}` };
    }
    if (column.fieldType !== "dimension") {
      return { valid: false, reason: `Group by must be a dimension: ${group.column}` };
    }
  }

  for (const filter of plan.filters ?? []) {
    const column = findColumn(catalog, filter.table, filter.column);
    if (!column) {
      return { valid: false, reason: `Filter column not allowed: ${filter.table}.${filter.column}` };
    }
    if (!ALLOWED_OPERATORS.has(filter.operator)) {
      return { valid: false, reason: `Filter operator not allowed: ${filter.operator}` };
    }
  }

  for (const join of plan.joins ?? []) {
    const exists = catalog.joins.some(
      (entry) =>
        entry.leftTable === join.leftTable &&
        entry.rightTable === join.rightTable &&
        entry.leftColumn === join.leftColumn &&
        entry.rightColumn === join.rightColumn &&
        entry.joinType === join.joinType,
    );
    if (!exists) {
      return { valid: false, reason: "Join not allowed by registry." };
    }
  }

  return { valid: true };
}
