'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { clientFormSchema } from "@/lib/validation";
import type { z } from "zod";

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export async function upsertClient(values: ClientFormValues) {
  const payload = clientFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skipping Supabase client mutation", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { id, ...rest } = payload;
  const normalizedWebsite = rest.website
    ? (() => {
        try {
          return new URL(rest.website).toString();
        } catch {
          return new URL(`https://${rest.website}`).toString();
        }
      })()
    : null;
  const dbPayload = {
    name: rest.name,
    company: rest.company,
    website: normalizedWebsite,
    primary_contact: rest.primaryContact,
    email: rest.email,
    phone: rest.phone,
    country: rest.country,
    timezone: rest.timezone,
    industry: rest.industry,
    relationship_status: rest.relationshipStatus,
    notes: rest.notes,
    tags: rest.tags,
  };
  const response = id
    ? await supabase.from("clients").update(dbPayload).eq("id", id).single()
    : await supabase.from("clients").insert(dbPayload).single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClient(id: string) {
  if (!id) return { success: false, message: "Client id required." };
  if (isDemoMode) {
    console.info("Demo mode: pretend deleting client", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}
