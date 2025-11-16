"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { upsertExpense, type ExpenseFormValues } from "@/actions/finance";
import { expenseFormSchema } from "@/lib/validation";
import type { Client, Project } from "@/lib/types";

const categories = ["Software", "Contractor", "Travel", "Salary", "Misc"] as const;

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
  const initialDefaults = {
    date: new Date().toISOString().slice(0, 10),
    currency: "INR",
    category: "Software",
  };
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { ...initialDefaults, ...defaultValues },
  });
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        date: new Date().toISOString().slice(0, 10),
        currency: "INR",
        category: "Software",
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

  const onSubmit = (values: ExpenseFormValues) => {
    startTransition(async () => {
      const result = await upsertExpense(values);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save expense");
        return;
      }
      toast.success("Expense saved");
      if (values.id) {
        onSuccess?.();
      } else {
        form.reset(initialDefaults);
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
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
      <div>
        <label className="text-sm font-medium text-zinc-600">Notes</label>
        <textarea
          {...form.register("notes")}
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save expense"}
        </button>
      </div>
    </form>
  );
}
