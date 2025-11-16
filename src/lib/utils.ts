import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

export function currencyFormatter(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const STATUS_COLORS: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-600",
  Completed: "bg-emerald-100 text-emerald-700",
  Planned: "bg-gray-100 text-gray-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Cancelled: "bg-rose-100 text-rose-700",
  Active: "bg-emerald-100 text-emerald-700",
  Dormant: "bg-yellow-100 text-yellow-700",
  "High-Risk": "bg-rose-100 text-rose-700",
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700",
};
