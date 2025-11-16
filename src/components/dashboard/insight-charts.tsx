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
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#059669"
            fillOpacity={1}
            fill="url(#rev)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#f43f5e"
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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={color} name={label} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
