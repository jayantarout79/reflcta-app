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
  "In Progress": "bg-sky-50 text-sky-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Planned: "bg-indigo-50 text-indigo-700",
  "On Hold": "bg-amber-50 text-amber-700",
  Cancelled: "bg-rose-50 text-rose-700",
  Active: "bg-emerald-50 text-emerald-700",
  Dormant: "bg-slate-100 text-slate-600",
  Past: "bg-slate-200 text-slate-700",
  "High-Risk": "bg-rose-100 text-rose-700",
  Draft: "bg-slate-100 text-slate-600",
  Sent: "bg-blue-50 text-blue-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700",
  New: "bg-cyan-50 text-cyan-700",
  Contacted: "bg-indigo-50 text-indigo-700",
  "Proposal Sent": "bg-purple-50 text-purple-700",
  Won: "bg-emerald-50 text-emerald-700",
  Lost: "bg-rose-50 text-rose-700",
  "To Do": "bg-slate-50 text-slate-600",
  Done: "bg-emerald-50 text-emerald-700",
  Blocked: "bg-rose-50 text-rose-700",
  "On Leave": "bg-amber-50 text-amber-700",
  Exited: "bg-slate-200 text-slate-700",
};
