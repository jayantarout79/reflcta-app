'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { projectFormSchema } from "@/lib/validation";
import type { z } from "zod";

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export async function upsertProject(values: ProjectFormValues) {
  const payload = projectFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skip Supabase project mutation", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { id, ...rest } = payload;
  const normalizeDate = (value?: string | null) => (value ? value : null);
  const dbPayload = {
    name: rest.name,
    client_id: rest.clientId,
    category: rest.category,
    description: rest.description,
    status: rest.status,
    priority: rest.priority,
    start_date: normalizeDate(rest.startDate),
    target_end_date: normalizeDate(rest.targetEndDate),
    owner_id: rest.ownerId,
    budget: rest.budget ?? null,
    tags: rest.tags ?? [],
  };
  const response = id
    ? await supabase.from("projects").update(dbPayload).eq("id", id).select("id").single()
    : await supabase.from("projects").insert(dbPayload).select("id").single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  const projectId = response.data?.id ?? id;
  revalidatePath("/projects");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { success: true };
}

export async function deleteProject(id: string) {
  if (!id) return { success: false, message: "Project id required." };
  if (isDemoMode) {
    console.info("Demo mode: pretend deleting project", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}
