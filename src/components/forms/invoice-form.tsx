"use client";

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { upsertInvoice, type InvoiceFormValues } from "@/actions/finance";
import { invoiceFormSchema } from "@/lib/validation";
import type { Client, Invoice, Project } from "@/lib/types";
import { currencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const todayIso = new Date().toISOString().slice(0, 10);
const defaultDueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  .toISOString()
  .slice(0, 10);

type InvoiceFormProps = {
  clients: Client[];
  projects: Project[];
  invoice?: Invoice;
  onCancel?: () => void;
  onSuccess?: () => void;
};

const defaultLineItem = { description: "", quantity: 1, unitPrice: 0, taxRate: 0 };

const mapInvoiceToFormValues = (invoice: Invoice): InvoiceFormValues => ({
  id: invoice.id,
  clientId: invoice.clientId,
  projectId: invoice.projectId ?? "",
  issueDate: invoice.issueDate?.slice(0, 10) ?? todayIso,
  dueDate: invoice.dueDate?.slice(0, 10) ?? defaultDueDate,
  currency: invoice.currency ?? "INR",
  status: invoice.status,
  notes: invoice.notes ?? "",
  lineItems:
    invoice.lineItems?.length > 0
      ? invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate ?? 0,
        }))
      : [{ ...defaultLineItem }],
});

export function InvoiceForm({ clients, projects, invoice, onCancel, onSuccess }: InvoiceFormProps) {
  const [isPending, startTransition] = useTransition();
  const buildDefaultValues = useCallback((): InvoiceFormValues => {
    return {
      id: undefined,
      clientId: clients[0]?.id ?? "",
      projectId: "",
      issueDate: todayIso,
      dueDate: defaultDueDate,
      currency: "INR",
      status: "Draft",
      notes: "",
      lineItems: [{ ...defaultLineItem }],
    };
  }, [clients]);
  const initialDefaults = useMemo(() => buildDefaultValues(), [buildDefaultValues]);
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialDefaults,
  });
  useEffect(() => {
    if (invoice) {
      form.reset(mapInvoiceToFormValues(invoice));
    } else {
      form.reset(buildDefaultValues());
    }
  }, [invoice, form, buildDefaultValues]);
  const items = useFieldArray({
    control: form.control,
    name: "lineItems",
  });
  const watchedLineItems = useWatch({
    control: form.control,
    name: "lineItems",
  });
  const currency = useWatch({
    control: form.control,
    name: "currency",
  }) as string | undefined;
  const totals = watchedLineItems.reduce(
    (acc, item) => {
      const quantity = item?.quantity ?? 0;
      const unitPrice = item?.unitPrice ?? 0;
      const base = quantity * unitPrice;
      const taxRate = item?.taxRate ?? 0;
      const tax = taxRate ? (base * taxRate) / 100 : 0;
      return {
        subtotal: acc.subtotal + base,
        tax: acc.tax + tax,
      };
    },
    { subtotal: 0, tax: 0 },
  );
  const grandTotal = totals.subtotal + totals.tax;
  const isEditing = Boolean(invoice);

  const handleCancel = () => {
    form.reset(buildDefaultValues());
    onCancel?.();
  };

  const onSubmit = (values: InvoiceFormValues) => {
    startTransition(async () => {
      const result = await upsertInvoice(values);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save invoice");
        return;
      }
      toast.success("Invoice saved");
      if (isEditing) {
        onSuccess?.();
      } else {
        form.reset(buildDefaultValues());
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="card space-y-5 p-6"
    >
      <div className="flex flex-col gap-2 border-b border-white/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            {isEditing ? "Edit invoice" : "Create invoice"}
          </p>
          <p className="text-lg font-semibold text-[var(--color-foreground)]">
            {isEditing ? invoice?.id : "New billing record"}
          </p>
        </div>
        {isEditing && (
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
            Cancel edit
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-zinc-600">Client</label>
          <select
            {...form.register("clientId")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Project</label>
          <select
            {...form.register("projectId")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Status</label>
          <select
            {...form.register("status")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {["Draft", "Sent", "Paid", "Overdue"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-zinc-600">Issue date</label>
          <input
            type="date"
            {...form.register("issueDate")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Due date</label>
          <input
            type="date"
            {...form.register("dueDate")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Currency</label>
          <input
            {...form.register("currency")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Line items</label>
        <div className="mt-2 space-y-2">
          <div className="hidden grid-cols-6 gap-2 text-xs uppercase tracking-wide text-zinc-400 sm:grid">
            <span className="sm:col-span-3">Description</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span>Tax %</span>
            <span></span>
          </div>
          {items.fields.map((field, index) => (
            <div
              key={field.id}
            className="grid gap-2 rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/70 p-3 shadow-sm sm:grid-cols-6"
          >
              <div className="sm:col-span-3">
                <input
                  placeholder="Description"
                  {...form.register(`lineItems.${index}.description` as const)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <input
                type="number"
                placeholder="Qty"
                {...form.register(`lineItems.${index}.quantity` as const, {
                  valueAsNumber: true,
                })}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Unit price"
                {...form.register(`lineItems.${index}.unitPrice` as const, {
                  valueAsNumber: true,
                })}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Tax%"
                {...form.register(`lineItems.${index}.taxRate` as const, {
                  valueAsNumber: true,
                })}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => items.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => items.append({ ...defaultLineItem })}>
            + Add line item
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-white/50 bg-[var(--color-surface-muted)]/90 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Subtotal</p>
            <p className="text-lg font-semibold text-[var(--color-foreground)]">
              {currencyFormatter(totals.subtotal, currency ?? "INR")}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Taxes</p>
            <p className="text-lg font-semibold text-[var(--color-foreground)]">
              {currencyFormatter(totals.tax, currency ?? "INR")}
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-dashed border-[var(--color-border)] pt-3">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Total due</p>
          <p className="text-2xl font-semibold text-[var(--color-foreground)]">
            {currencyFormatter(grandTotal, currency ?? "INR")}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="ghost" size="md" onClick={handleCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Update invoice" : "Save invoice"}
        </Button>
      </div>
    </form>
  );
}
