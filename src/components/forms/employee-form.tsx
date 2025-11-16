"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { upsertEmployee, type EmployeeFormValues } from "@/actions/hr";
import { employeeFormSchema } from "@/lib/validation";

const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contractor",
  "Freelancer",
] as const;

const roles = ["admin", "manager", "employee", "viewer"] as const;
const statuses = ["Active", "On Leave", "Exited"] as const;

export function EmployeeForm({
  defaultValues,
}: {
  defaultValues?: Partial<EmployeeFormValues>;
}) {
  const [isPending, startTransition] = useTransition();
  const [skillsInput, setSkillsInput] = useState(
    defaultValues?.skills?.join(", ") ?? "",
  );
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      role: "employee",
      employmentType: "Full-time",
      status: "Active",
      ...defaultValues,
    },
  });

  const onSubmit = (values: EmployeeFormValues) => {
    const skillsArray = skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    startTransition(async () => {
      const result = await upsertEmployee({
        ...values,
        skills: skillsArray.length ? skillsArray : undefined,
      });
      if (!result.success) {
        toast.error(result.message ?? "Unable to save employee");
        return;
      }
      toast.success("Employee saved");
      if (!values.id) {
        form.reset();
        setSkillsInput("");
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-600">Name</label>
          <input
            {...form.register("name")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Email</label>
          <input
            type="email"
            {...form.register("email")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Role</label>
          <select
            {...form.register("role")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm capitalize"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Job title</label>
          <input
            {...form.register("jobTitle")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Location</label>
          <input
            {...form.register("location")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Join date</label>
          <input
            type="date"
            {...form.register("joinDate")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Employment type</label>
          <select
            {...form.register("employmentType")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {employmentTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
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
          <label className="text-sm font-medium text-zinc-600">Salary</label>
          <input
            type="number"
            {...form.register("salary", { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Skills</label>
        <input
          value={skillsInput}
          onChange={(event) => setSkillsInput(event.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Comma separated"
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
          {isPending ? "Saving..." : "Save employee"}
        </button>
      </div>
    </form>
  );
}
