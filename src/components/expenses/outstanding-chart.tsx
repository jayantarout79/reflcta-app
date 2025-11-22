"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function OutstandingExpensesChart({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  const formatCurrency = (
    value:
      | number
      | string
      | boolean
      | null
      | undefined
      | ReadonlyArray<number | string>,
  ) => {
    const resolvedValue = Array.isArray(value) ? value[0] : value;

    if (typeof resolvedValue === "number") {
      return `₹${resolvedValue.toLocaleString("en-IN")}`;
    }

    if (typeof resolvedValue === "string") {
      const numericValue = Number(resolvedValue);
      if (Number.isFinite(numericValue)) {
        return `₹${numericValue.toLocaleString("en-IN")}`;
      }
    }

    return "";
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, bottom: 10, left: 0, right: 70 }}
          barSize={24}
        >
          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" horizontal vertical={false} />
          <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
            }}
            labelStyle={{ fontWeight: 600, color: "#0f172a" }}
            formatter={(value) => [formatCurrency(value), "Outstanding"]}
          />
          <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 6, 6]}>
            <LabelList
              dataKey="amount"
              position="right"
              offset={12}
              formatter={(value) => formatCurrency(value)}
              className="text-sm fill-slate-700"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
