'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { leadFormSchema } from "@/lib/validation";
import type { z } from "zod";

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export async function upsertLead(values: LeadFormValues) {
  const payload = leadFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skipping Supabase lead mutation", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { id, ...rest } = payload;
  const dbPayload = {
    name: rest.name,
    company: rest.company,
    email: rest.email,
    phone: rest.phone ?? null,
    country: rest.country ?? null,
    industry: rest.industry ?? null,
    source: rest.source,
    status: rest.status,
    notes: rest.notes ?? null,
    next_follow_up: rest.nextFollowUp ? rest.nextFollowUp : null,
    // These columns are stored with capitalized names in the existing database
    // schema, so we write using that casing to avoid schema cache errors.
    Cold_Email_Sent_Flag: rest.coldEmailSentFlag ?? null,
    Cold_Email_Sent_Ts: rest.coldEmailSentTs ? rest.coldEmailSentTs : null,
  };
  const query = supabase.from("leads");
  const response = id
    ? await query.update(dbPayload).eq("id", id).single()
    : await query.insert(dbPayload).single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  revalidatePath("/leads");
  revalidatePath("/clients");
  return { success: true };
}

export async function convertLeadToClient(leadId: string) {
  if (!leadId) return { success: false, message: "Lead id required." };
  if (isDemoMode) {
    console.info("Demo mode: convert lead", leadId);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client not available." };
  }
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (error || !lead) {
    return { success: false, message: error?.message ?? "Lead not found." };
  }
  const { error: clientError } = await supabase.from("clients").insert({
    name: lead.name,
    company: lead.company,
    primary_contact: lead.primary_contact ?? lead.name ?? lead.company,
    email: lead.email,
    phone: lead.phone,
    industry: lead.industry,
    country: lead.country,
    relationship_status: "Active",
    notes: lead.notes,
  });
  if (clientError) {
    return { success: false, message: clientError.message };
  }
  await supabase.from("leads").update({ status: "Won" }).eq("id", leadId);
  revalidatePath("/clients");
  revalidatePath("/leads");
  return { success: true };
}
