"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { invoiceFormSchema, expenseFormSchema } from "@/lib/validation";
import type { z } from "zod";

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const INVOICE_PREFIX = "INV-";
const INVOICE_PAD = 4;

function formatInvoiceId(sequence: number) {
  const padded = sequence.toString().padStart(INVOICE_PAD, "0");
  return `${INVOICE_PREFIX}${padded}`;
}

async function getNextInvoiceId(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    console.error("Unable to determine invoice sequence", error);
    return formatInvoiceId(1);
  }
  const lastId = data?.[0]?.id as string | undefined;
  if (lastId && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(lastId)) {
    return randomUUID();
  }
  const match = lastId?.match(/(\d+)$/);
  const nextSequence = match ? Number(match[1]) + 1 : 1;
  return formatInvoiceId(nextSequence);
}

export async function upsertInvoice(values: InvoiceFormValues) {
  const payload = invoiceFormSchema.parse(values);
  const total = payload.lineItems.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice;
    const tax = item.taxRate ? (base * item.taxRate) / 100 : 0;
    return sum + base + tax;
  }, 0);
  if (isDemoMode) {
    console.info("Demo mode: skip invoice mutation", { ...payload, total });
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { id, ...rest } = payload;
  const invoiceId = payload.id ?? (await getNextInvoiceId(supabase));
  const invoicePayload = {
    id: invoiceId,
    client_id: rest.clientId,
    project_id: rest.projectId ?? null,
    issue_date: rest.issueDate,
    due_date: rest.dueDate,
    currency: rest.currency ?? "INR",
    status: rest.status ?? "Draft",
    notes: rest.notes ?? null,
    total,
  };
  const invoiceResponse = id
    ? await supabase.from("invoices").update(invoicePayload).eq("id", id).select("*").single()
    : await supabase.from("invoices").insert(invoicePayload).select("*").single();
  if (invoiceResponse.error || !invoiceResponse.data) {
    return { success: false, message: invoiceResponse.error?.message ?? "Unable to save invoice." };
  }
  await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
  if (rest.lineItems.length > 0) {
    const lineItemsPayload = rest.lineItems.map((item) => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate ?? null,
      subtotal: item.quantity * item.unitPrice,
    }));
    const lineInsert = await supabase.from("invoice_line_items").insert(lineItemsPayload);
    if (lineInsert.error) {
      return { success: false, message: lineInsert.error.message };
    }
  }
  revalidatePath("/finances/invoices");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function setInvoiceStatus(
  invoiceId: string,
  status: "Draft" | "Sent" | "Paid" | "Overdue",
  paymentDate?: string,
) {
  if (!invoiceId) return { success: false, message: "Invoice id required." };
  if (isDemoMode) {
    console.info("Demo mode: update invoice status", { invoiceId, status });
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { error } = await supabase
    .from("invoices")
    .update({ status, payment_date: paymentDate ?? null })
    .eq("id", invoiceId);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/finances/invoices");
  return { success: true };
}

export async function upsertExpense(values: ExpenseFormValues) {
  const payload = expenseFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skip expense mutation", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { id, ...rest } = payload;
  const dbPayload = {
    expense_date: rest.date,
    amount: rest.amount,
    currency: rest.currency ?? "INR",
    category: rest.category,
    project_id: rest.projectId ?? null,
    client_id: rest.clientId ?? null,
    vendor: rest.vendor ?? null,
    notes: rest.notes ?? null,
  };
  const response = id
    ? await supabase.from("expenses").update(dbPayload).eq("id", id).single()
    : await supabase.from("expenses").insert(dbPayload).single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  revalidatePath("/finances/expenses");
  return { success: true };
}

export async function deleteExpense(id: string) {
  if (!id) return { success: false, message: "Expense id required." };
  if (isDemoMode) {
    console.info("Demo mode: pretend deleting expense", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/finances/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
