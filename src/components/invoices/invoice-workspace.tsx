"use client";

import { useState } from "react";
import { InvoiceForm } from "@/components/forms/invoice-form";
import type { Client, Invoice, Project } from "@/lib/types";
import { currencyFormatter, formatDate, STATUS_COLORS } from "@/lib/utils";
import { downloadInvoicePdf, printInvoicePdf } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Download, PencilLine, Printer } from "lucide-react";

type InvoiceWorkspaceProps = {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  canManage: boolean;
};

function summarizeItems(invoice: Invoice) {
  return invoice.lineItems.reduce(
    (acc, item) => {
      const base = item.quantity * item.unitPrice;
      const taxRate = item.taxRate ?? 0;
      const tax = taxRate ? (base * taxRate) / 100 : 0;
      return {
        subtotal: acc.subtotal + base,
        tax: acc.tax + tax,
      };
    },
    { subtotal: 0, tax: 0 },
  );
}

export function InvoiceWorkspace({
  invoices,
  clients,
  projects,
  canManage,
}: InvoiceWorkspaceProps) {
  const [editing, setEditing] = useState<Invoice | null>(null);
  const handleEdit = (invoice: Invoice) => {
    setEditing(invoice);
  };

  return (
    <div className="space-y-5">
      {canManage && clients.length > 0 ? (
        <InvoiceForm
          clients={clients}
          projects={projects}
          invoice={editing ?? undefined}
          onCancel={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      ) : null}
      {!canManage && (
        <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access. Contact your admin to create or edit invoices.
        </p>
      )}
      {canManage && clients.length === 0 && (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Add a client before creating invoices.
        </p>
      )}
      <div className="card p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
              Recent invoices
            </p>
            <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">Billing pipeline</h2>
          </div>
          <p className="text-xs text-[var(--color-muted)]">{invoices.length} records</p>
        </div>
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const { subtotal, tax } = summarizeItems(invoice);
            return (
              <div
                key={invoice.id}
                className="grid gap-3 rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/80 px-4 py-3 shadow-sm sm:grid-cols-6 sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">{invoice.id}</p>
                  <p className="text-xs text-[var(--color-muted)]">{invoice.clientName ?? "Unknown client"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Project
                  </p>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{invoice.projectName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Due
                  </p>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Subtotal / Tax
                  </p>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {currencyFormatter(subtotal, invoice.currency ?? "INR")}
                    <span className="text-xs text-zinc-500">
                      {" "}
                      + {currencyFormatter(tax, invoice.currency ?? "INR")}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Total
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {currencyFormatter(subtotal + tax, invoice.currency ?? "INR")}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span
                    className={`ml-auto chip px-3 py-1 ${STATUS_COLORS[invoice.status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {invoice.status}
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {canManage && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(invoice)}>
                        <PencilLine className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    <Button type="button" variant="secondary" size="sm" onClick={() => printInvoicePdf(invoice)}>
                      <Printer className="h-3.5 w-3.5" /> Print
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => downloadInvoicePdf(invoice)}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {invoices.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
              No invoices recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
