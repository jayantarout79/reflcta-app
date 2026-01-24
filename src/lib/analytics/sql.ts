import type {
  AnalyticsPlan,
  PlanDerivedMetric,
  PlanFilter,
  PlanSelect,
  SemanticCatalog,
} from "./types";
import { normalizePlanLimits } from "./validation";

const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function quoteIdentifier(identifier: string) {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new Error("Unsafe identifier.");
  }
  return `"${identifier}"`;
}

function tableRef(table: string) {
  return `public.${quoteIdentifier(table)}`;
}

function columnRef(table: string, column: string) {
  return `${quoteIdentifier(table)}.${quoteIdentifier(column)}`;
}

function selectExpression(select: PlanSelect) {
  const base = columnRef(select.table, select.column);
  if (select.aggregation) {
    return `${select.aggregation.toUpperCase()}(${base})`;
  }
  return base;
}

function derivedExpression(metric: PlanDerivedMetric) {
  const numerator = selectExpression(metric.numerator);
  const denominator = selectExpression(metric.denominator);
  return `(${numerator} * 100.0 / NULLIF(${denominator}, 0))`;
}

function buildFilter(
  filter: PlanFilter,
  paramIndex: number,
): { sql: string; params: Array<string | number | Array<string | number>> } {
  const col = columnRef(filter.table, filter.column);
  if (filter.operator === "in") {
    return {
      sql: `${col} = ANY($${paramIndex})`,
      params: [Array.isArray(filter.value) ? filter.value : [filter.value]],
    };
  }
  return {
    sql: `${col} ${filter.operator} $${paramIndex}`,
    params: [filter.value as string | number],
  };
}

export function compileSql(plan: AnalyticsPlan, catalog: SemanticCatalog) {
  const selects: string[] = [];
  const columnAliases: string[] = [];

  for (const select of plan.select) {
    const expr = selectExpression(select);
    const alias = select.alias ?? `${select.table}_${select.column}`;
    selects.push(`${expr} AS ${quoteIdentifier(alias)}`);
    columnAliases.push(alias);
  }

  for (const metric of plan.derivedMetrics ?? []) {
    const expr = derivedExpression(metric);
    selects.push(`${expr} AS ${quoteIdentifier(metric.alias)}`);
    columnAliases.push(metric.alias);
  }

  const fromTable = plan.joins?.[0]?.leftTable ?? plan.tables[0];
  let sql = `SELECT ${selects.join(", ")} FROM ${tableRef(fromTable)} ${quoteIdentifier(fromTable)}`;

  for (const join of plan.joins ?? []) {
    sql += ` ${join.joinType.toUpperCase()} JOIN ${tableRef(join.rightTable)} ${quoteIdentifier(
      join.rightTable,
    )} ON ${columnRef(join.leftTable, join.leftColumn)} = ${columnRef(
      join.rightTable,
      join.rightColumn,
    )}`;
  }

  const params: Array<string | number | Array<string | number>> = [];
  const filters = plan.filters ?? [];
  if (filters.length) {
    const clauses = filters.map((filter) => {
      const compiled = buildFilter(filter, params.length + 1);
      params.push(...compiled.params);
      return compiled.sql;
    });
    sql += ` WHERE ${clauses.join(" AND ")}`;
  }

  if (plan.groupBy?.length) {
    const groupBy = plan.groupBy.map((group) => columnRef(group.table, group.column));
    sql += ` GROUP BY ${groupBy.join(", ")}`;
  }

  if (plan.orderBy?.length) {
    const orderBy = plan.orderBy.map((order) => {
      if (order.alias) {
        return `${quoteIdentifier(order.alias)} ${order.direction.toUpperCase()}`;
      }
      if (order.column && order.table) {
        return `${columnRef(order.table, order.column)} ${order.direction.toUpperCase()}`;
      }
      return "";
    });
    const sanitized = orderBy.filter(Boolean);
    if (sanitized.length) {
      sql += ` ORDER BY ${sanitized.join(", ")}`;
    }
  }

  const limit = normalizePlanLimits(plan);
  sql += ` LIMIT ${limit}`;

  return { sql, params, columnAliases };
}
