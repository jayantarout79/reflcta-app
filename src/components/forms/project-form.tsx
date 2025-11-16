"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { upsertProject, type ProjectFormValues } from "@/actions/projects";
import { projectFormSchema } from "@/lib/validation";
import type { Client, Employee } from "@/lib/types";

const statuses = ["Planned", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
const priorities = ["Low", "Medium", "High"] as const;

export function ProjectForm({
  clients,
  employees,
  defaultValues,
}: {
  clients: Client[];
  employees: Employee[];
  defaultValues?: Partial<ProjectFormValues>;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      clientId: clients[0]?.id,
      ownerId: employees[0]?.profileId ?? employees[0]?.id,
      category: "",
      status: "Planned",
      priority: "Medium",
      ...defaultValues,
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
    startTransition(async () => {
      const result = await upsertProject(values);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save project");
        return;
      }
      toast.success("Project saved");
      if (!values.id) form.reset();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-600">Project name</label>
          <input
            {...form.register("name")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
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
          <label className="text-sm font-medium text-zinc-600">Category</label>
          <input
            {...form.register("category")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="AI automation, analytics..."
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Owner</label>
          <select
            {...form.register("ownerId")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.profileId ?? employee.id}
                disabled={!employee.profileId}
              >
                {employee.name}
                {!employee.profileId ? " (profile missing)" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            {`Select the project owner. Only employees linked to profiles can own projects.`}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Status</label>
          <select
            {...form.register("status")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Priority</label>
          <select
            {...form.register("priority")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {priorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Start date</label>
          <input
            type="date"
            {...form.register("startDate")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Target end</label>
          <input
            type="date"
            {...form.register("targetEndDate")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Budget</label>
          <input
            type="number"
            {...form.register("budget", { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Description</label>
        <textarea
          {...form.register("description")}
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save project"}
        </button>
      </div>
    </form>
  );
}
