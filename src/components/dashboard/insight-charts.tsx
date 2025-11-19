"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendChartProps {
  data: { month: string; revenue: number; expenses: number }[];
}

export function RevenueExpensesChart({ data }: TrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            }}
            labelStyle={{ fontWeight: 600, color: "#0f172a" }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            fillOpacity={1}
            fill="url(#rev)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#94a3b8"
            fillOpacity={1}
            fill="url(#exp)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarData {
  month: string;
  value: number;
}

export function SimpleBarChart({
  data,
  color,
  label,
}: {
  data: BarData[];
  color: string;
  label: string;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -10, right: 0, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.08)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
            }}
            labelStyle={{ fontWeight: 600, color: "#0f172a" }}
          />
          <Bar dataKey="value" fill={color} name={label} radius={[10, 10, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
