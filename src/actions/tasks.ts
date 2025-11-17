'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { taskFormSchema, timeEntrySchema } from "@/lib/validation";
import type { z } from "zod";

export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

export async function upsertTask(values: TaskFormValues) {
  const payload = taskFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skip Supabase task mutation", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { id, ...rest } = payload;
  const dbPayload = {
    title: rest.title,
    description: rest.description ?? null,
    project_id: rest.projectId,
    assignee_id: rest.assigneeId,
    status: rest.status,
    priority: rest.priority,
    start_date: rest.startDate || null,
    due_date: rest.dueDate || null,
    estimated_hours: rest.estimatedHours ?? null,
  };
  const response = id
    ? await supabase.from("tasks").update(dbPayload).eq("id", id).select("project_id").single()
    : await supabase.from("tasks").insert(dbPayload).select("project_id").single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  const projectId = response.data?.project_id ?? rest.projectId;
  revalidatePath("/tasks");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { success: true };
}

export async function logTimeEntry(values: TimeEntryFormValues) {
  const payload = timeEntrySchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skip Supabase time entry", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const createPayload = (omit: Array<"employee_id" | "employee_name"> = []) => {
    const base: Record<string, string | number | null> = {
      task_id: payload.taskId,
      profile_id: payload.employeeId,
      entry_date: payload.date,
      hours: payload.hours,
      notes: payload.notes ?? null,
    };
    if (!omit.includes("employee_id") && payload.employeeRecordId) {
      base.employee_id = payload.employeeRecordId;
    }
    if (!omit.includes("employee_name") && payload.employeeName) {
      base.employee_name = payload.employeeName;
    }
    return base;
  };

  const attempts: Array<Array<"employee_id" | "employee_name">> = [
    [],
    ["employee_id"],
    ["employee_id", "employee_name"],
  ];

  let response;
  for (const omit of attempts) {
    response = await supabase
      .from("time_entries")
      .insert(createPayload(omit))
      .select("id")
      .single();
    if (!response.error) break;
    const combined = `${response.error.message ?? ""} ${response.error.details ?? ""}`.toLowerCase();
    if (
      !(response.error.code === "42703" ||
        combined.includes("employee_id") ||
        combined.includes("employee_name"))
    ) {
      break;
    }
  }

  if (!response || response.error || !response.data) {
    return { success: false, message: response?.error?.message ?? "Unable to log time" };
  }
  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTimeEntry(id: string, values: TimeEntryFormValues) {
  if (!id) return { success: false, message: "Time entry id required" };
  const payload = timeEntrySchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skip Supabase time entry update", { id, payload });
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const updatePayload: Record<string, string | number | null> = {
    task_id: payload.taskId,
    profile_id: payload.employeeId,
    entry_date: payload.date,
    hours: payload.hours,
    notes: payload.notes ?? null,
  };
  if (payload.employeeRecordId) {
    updatePayload.employee_id = payload.employeeRecordId;
  }
  if (payload.employeeName) {
    updatePayload.employee_name = payload.employeeName;
  }
  const response = await supabase.from("time_entries").update(updatePayload).eq("id", id);
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTask(id: string, projectId?: string) {
  if (!id) return { success: false, message: "Task id required." };
  if (isDemoMode) {
    console.info("Demo mode: pretend deleting task", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/tasks");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { success: true };
}
