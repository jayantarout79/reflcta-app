'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { employeeFormSchema } from "@/lib/validation";
import type { z } from "zod";

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export async function upsertEmployee(values: EmployeeFormValues) {
  const payload = employeeFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skip employee mutation", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { id, ...rest } = payload;
  const dbPayload = {
    name: rest.name,
    email: rest.email,
    role: rest.role,
    job_title: rest.jobTitle ?? null,
    location: rest.location ?? null,
    join_date: rest.joinDate ?? null,
    employment_type: rest.employmentType,
    status: rest.status ?? "Active",
    salary: rest.salary ?? null,
    skills: rest.skills ?? [],
    notes: rest.notes ?? null,
  };
  const response = id
    ? await supabase.from("employees").update(dbPayload).eq("id", id).single()
    : await supabase.from("employees").insert(dbPayload).single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  revalidatePath("/hr/employees");
  return { success: true };
}

export async function deleteEmployee(id: string) {
  if (!id) return { success: false, message: "Employee id required." };
  if (isDemoMode) {
    console.info("Demo mode: pretend deleting employee", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/hr/employees");
  return { success: true };
}
