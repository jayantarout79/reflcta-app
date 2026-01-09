'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { vendorFormSchema } from "@/lib/validation";
import type { z } from "zod";

export type VendorFormValues = z.infer<typeof vendorFormSchema>;

export async function upsertVendor(values: VendorFormValues) {
  const payload = vendorFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skipping Supabase vendor mutation", payload);
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
    company: rest.company ?? null,
    website: normalizedWebsite,
    email: rest.email ?? null,
    phone: rest.phone ?? null,
    country: rest.country ?? null,
    notes: rest.notes ?? null,
  };
  const response = id
    ? await supabase.from("vendors").update(dbPayload).eq("id", id).single()
    : await supabase.from("vendors").insert(dbPayload).single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  revalidatePath("/vendors");
  return { success: true };
}

export async function deleteVendor(id: string) {
  if (!id) return { success: false, message: "Vendor id required." };
  if (isDemoMode) {
    console.info("Demo mode: pretend deleting vendor", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/vendors");
  return { success: true };
}
