"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { upsertExpense, type ExpenseFormValues } from "@/actions/finance";
import { expenseFormSchema } from "@/lib/validation";
import type { Client, Project } from "@/lib/types";
import { Button } from "@/components/ui/button";

const categories = ["Software", "Contractor", "Travel", "Salary", "Misc"] as const;

const normalizeDateInput = (value?: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
};

export function ExpenseForm({
  clients,
  projects,
  defaultValues,
  onSuccess,
}: {
  clients: Client[];
  projects: Project[];
  defaultValues?: Partial<ExpenseFormValues>;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const normalizedDefaults = useMemo<ExpenseFormValues>(
    () => ({
      id: defaultValues?.id,
      date: normalizeDateInput(defaultValues?.date),
      amount: defaultValues?.amount ?? 0,
      currency: defaultValues?.currency ?? "INR",
      category: defaultValues?.category ?? "Software",
      projectId: defaultValues?.projectId ?? "",
      clientId: defaultValues?.clientId ?? "",
      vendor: defaultValues?.vendor ?? "",
      paidBy: defaultValues?.paidBy ?? "",
      settledUp: defaultValues?.settledUp ?? null,
      notes: defaultValues?.notes ?? "",
    }),
    [defaultValues],
  );
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: normalizedDefaults,
  });
  useEffect(() => {
    form.reset(normalizedDefaults);
  }, [form, normalizedDefaults]);

  const onSubmit = (values: ExpenseFormValues) => {
    const payload: ExpenseFormValues = {
      ...values,
      date: normalizeDateInput(values.date),
      clientId: values.clientId || undefined,
      projectId: values.projectId || undefined,
      paidBy: values.paidBy?.trim() || undefined,
      settledUp: values.settledUp ?? null,
    };
    startTransition(async () => {
      const result = await upsertExpense(payload);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save expense");
        return;
      }
      toast.success("Expense saved");
      if (payload.id) {
        onSuccess?.();
      } else {
        form.reset({
          ...normalizedDefaults,
          date: normalizeDateInput(),
          amount: 0,
          clientId: "",
          projectId: "",
        });
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="card space-y-5 p-6"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-zinc-600">Date</label>
          <input
            type="date"
            {...form.register("date")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Amount</label>
          <input
            type="number"
            {...form.register("amount", { valueAsNumber: true })}
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
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-zinc-600">Category</label>
          <select
            {...form.register("category")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Client</label>
          <select
            {...form.register("clientId")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">None</option>
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
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Vendor</label>
        <input
          {...form.register("vendor")}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Vendor / payee"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-600">Paid by</label>
          <input
            {...form.register("paidBy")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Person or team to reimburse"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Settled?</label>
          <select
            {...form.register("settledUp", {
              setValueAs: (val) => {
                if (val === "" || val === undefined) return null;
                return val === "true";
              },
            })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">Not set</option>
            <option value="false">Outstanding</option>
            <option value="true">Settled</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Notes</label>
        <textarea
          {...form.register("notes")}
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save expense"}
        </Button>
      </div>
    </form>
  );
}
