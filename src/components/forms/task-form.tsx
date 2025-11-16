"use client";

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  upsertTask,
  logTimeEntry,
  updateTimeEntry,
  type TaskFormValues,
  type TimeEntryFormValues,
} from "@/actions/tasks";
import { taskFormSchema, timeEntrySchema } from "@/lib/validation";
import type { Employee, Project } from "@/lib/types";

const statuses = ["To Do", "In Progress", "Blocked", "Done"] as const;
const priorities = ["Low", "Medium", "High"] as const;

export function TaskForm({
  projects,
  employees,
  defaultValues,
}: {
  projects: Project[];
  employees: Employee[];
  defaultValues?: Partial<TaskFormValues>;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      projectId: projects[0]?.id,
      assigneeId: employees[0]?.profileId ?? employees[0]?.id,
      status: "To Do",
      priority: "Medium",
      ...defaultValues,
    },
  });
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        title: "",
        projectId: projects[0]?.id,
        assigneeId: employees[0]?.profileId ?? employees[0]?.id,
        status: "To Do",
        priority: "Medium",
        ...defaultValues,
      });
    }
  }, [defaultValues, form, employees, projects]);

  const onSubmit = (values: TaskFormValues) => {
    startTransition(async () => {
      const result = await upsertTask(values);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save task");
        return;
      }
      toast.success("Task saved");
      form.reset();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-600">Title</label>
          <input
            {...form.register("title")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Project</label>
          <select
            {...form.register("projectId")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Assignee</label>
          <select
            {...form.register("assigneeId")}
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
            Tasks reference the assignee&apos;s profile. Ensure the employee is linked to a profile.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <label className="text-sm font-medium text-zinc-600">Due date</label>
          <input
            type="date"
            {...form.register("dueDate")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Est. hours</label>
          <input
            type="number"
            step="0.5"
            {...form.register("estimatedHours", { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save task"}
        </button>
      </div>
    </form>
  );
}

export function TimeEntryForm({
  taskId,
  employees,
  defaultEmployeeId,
  defaultValues,
  onSuccess,
}: {
  taskId: string;
  employees: Employee[];
  defaultEmployeeId?: string;
  defaultValues?: Partial<TimeEntryFormValues>;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const prioritizedEmployees = useMemo(
    () => employees.filter((employee) => Boolean(employee.profileId)),
    [employees],
  );
  const resolvedEmployeeId = useMemo(() => {
    if (defaultEmployeeId) return defaultEmployeeId;
    return prioritizedEmployees[0]?.profileId ?? "";
  }, [defaultEmployeeId, prioritizedEmployees]);
  const resolvedEmployee = useMemo(
    () => prioritizedEmployees.find((emp) => emp.profileId === resolvedEmployeeId) ?? prioritizedEmployees[0],
    [prioritizedEmployees, resolvedEmployeeId],
  );
  const buildDefaults = useCallback(() => {
    if (defaultValues) {
      return {
        taskId,
        employeeId: defaultValues.employeeId ?? resolvedEmployeeId,
        employeeRecordId: defaultValues.employeeRecordId ?? resolvedEmployee?.id ?? "",
        employeeName: defaultValues.employeeName ?? resolvedEmployee?.name ?? "",
        date: defaultValues.date ?? new Date().toISOString().slice(0, 10),
        hours: defaultValues.hours ?? 1,
        notes: defaultValues.notes ?? "",
        id: defaultValues.id,
      };
    }
    return {
      taskId,
      employeeId: resolvedEmployeeId,
      employeeRecordId: resolvedEmployee?.id ?? "",
      employeeName: resolvedEmployee?.name ?? "",
      date: new Date().toISOString().slice(0, 10),
      hours: 1,
      notes: "",
    };
  }, [
    defaultValues,
    resolvedEmployee?.id,
    resolvedEmployee?.name,
    resolvedEmployeeId,
    taskId,
  ]);
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: buildDefaults(),
  });
  useEffect(() => {
    form.reset(buildDefaults());
  }, [buildDefaults, form]);
  const selectedProfileId = useWatch({
    control: form.control,
    name: "employeeId",
  });
  useEffect(() => {
    const selected = prioritizedEmployees.find((employee) => employee.profileId === selectedProfileId);
    if (selected) {
      form.setValue("employeeName", selected.name);
      form.setValue("employeeRecordId", selected.id);
    }
  }, [selectedProfileId, prioritizedEmployees, form]);

  const onSubmit = (values: TimeEntryFormValues) => {
    startTransition(async () => {
      const parsed = timeEntrySchema.parse(values);
      const action = parsed.id ? updateTimeEntry : logTimeEntry;
      const result = parsed.id ? await action(parsed.id, parsed) : await action(parsed);
      if (!result.success) {
        toast.error(result.message ?? "Unable to log time");
        return;
      }
      toast.success("Time logged");
      form.reset(buildDefaults());
      onSuccess?.();
    });
  };

  if (prioritizedEmployees.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-500">
        Add an employee with a linked profile before logging time.
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
      <input type="hidden" {...form.register("id")} />
      <input type="hidden" {...form.register("taskId")} />
      <input type="hidden" {...form.register("employeeName")} />
      <input type="hidden" {...form.register("employeeRecordId")} />
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600">Team member</label>
          <select
            {...form.register("employeeId")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {prioritizedEmployees.map((employee) => (
              <option key={employee.id} value={employee.profileId}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Hours</label>
          <input
            type="number"
            step="0.25"
            {...form.register("hours", { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr,120px]">
        <div>
          <label className="text-xs font-medium text-zinc-600">Notes</label>
          <textarea
            {...form.register("notes")}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="What did you work on?"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Date</label>
          <input
            type="date"
            {...form.register("date")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-70"
      >
        {isPending ? "Logging..." : "Log time"}
      </button>
    </form>
  );
}
