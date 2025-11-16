import { currencyFormatter } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
  trend?: string;
  currency?: boolean;
}

export function MetricCard({ label, value, trend, currency }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-zinc-900">
        {currency ? currencyFormatter(value) : value.toLocaleString()}
      </p>
      {trend && <p className="text-xs text-emerald-600">{trend}</p>}
    </div>
  );
}
