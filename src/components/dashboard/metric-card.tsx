import type { LucideIcon } from "lucide-react";
import { cn, currencyFormatter } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
  trend?: string;
  currency?: boolean;
  icon?: LucideIcon;
  progress?: {
    label: string;
    value: number;
    tone?: "primary" | "warning" | "success";
  };
}

export function MetricCard({ label, value, trend, currency, icon: Icon, progress }: MetricCardProps) {
  const formatted = currency ? currencyFormatter(value) : value.toLocaleString();
  const progressValue = progress ? Math.min(Math.max(progress.value, 0), 1) : null;
  const toneClass =
    progress?.tone === "warning"
      ? "bg-[var(--color-warning)]"
      : progress?.tone === "success"
        ? "bg-[var(--color-positive)]"
        : "bg-[var(--color-primary)]";

  return (
    <div className="card flex flex-col gap-4 p-5" data-hover="true">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">{formatted}</p>
        </div>
        {Icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {trend && <p className="text-xs font-medium text-[var(--color-muted)]">{trend}</p>}
      {progress && progressValue !== null && (
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">
            <span>{progress.label}</span>
            <span>{Math.round(progressValue * 100)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[var(--color-border)]/60">
            <div
              className={cn("h-full rounded-full transition-all", toneClass)}
              style={{ width: `${Math.round(progressValue * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
