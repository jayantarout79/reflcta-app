export type SemanticColumn = {
  table: string;
  column: string;
  synonyms: string[];
  sampleValue?: string | null;
  description?: string | null;
  fieldType: "dimension" | "measure";
  aggregationType?: "sum" | "avg" | "percent" | "count" | null;
};

export type SemanticJoin = {
  leftTable: string;
  rightTable: string;
  leftColumn: string;
  rightColumn: string;
  joinType: "inner" | "left" | "right";
  description?: string | null;
};

export type SemanticCatalog = {
  tables: string[];
  columns: Record<string, SemanticColumn[]>;
  joins: SemanticJoin[];
  generatedAt: string;
};

export type AggregationType = "sum" | "avg" | "count";
export type FilterOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "like";

export type PlanSelect = {
  table: string;
  column: string;
  alias?: string;
  aggregation?: AggregationType;
};

export type PlanGroupBy = {
  table: string;
  column: string;
};

export type PlanOrderBy = {
  table?: string;
  column?: string;
  direction: "asc" | "desc";
  aggregation?: AggregationType;
  alias?: string;
};

export type PlanFilter = {
  table: string;
  column: string;
  operator: FilterOperator;
  value: string | number | Array<string | number>;
};

export type PlanDerivedMetric = {
  alias: string;
  type: "percent";
  numerator: PlanSelect;
  denominator: PlanSelect;
};

export type AnalyticsPlan = {
  question: string;
  tables: string[];
  joins?: SemanticJoin[];
  select: PlanSelect[];
  filters?: PlanFilter[];
  groupBy?: PlanGroupBy[];
  orderBy?: PlanOrderBy[];
  limit?: number;
  derivedMetrics?: PlanDerivedMetric[];
  chartSuggestion?: "bar" | "line" | "table";
  clarifyingQuestion?: string | null;
  queryDescription?: string;
  answerSummary?: string;
};

export type AnalyticsResult = {
  summary: string;
  columns: string[];
  rows: Record<string, string | number | null>[];
  rowCount: number;
  chartSuggestion?: "bar" | "line" | "table";
  explanation?: string;
  debug?: {
    plan: AnalyticsPlan;
    sql: string;
    trace?: string[];
  };
};
