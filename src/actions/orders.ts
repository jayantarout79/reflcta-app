"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { orderUpdateSchema } from "@/lib/validation";
import type { z } from "zod";

export type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;

export async function updateOrder(values: OrderUpdateValues) {
  const payload = orderUpdateSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skipping Supabase order update", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { id, ...rest } = payload;
  const updatePayload = {
    customer_name: rest.customerName,
    customer_phone: rest.customerPhone,
    customer_email: rest.customerEmail ? rest.customerEmail : null,
    shipping_address_line1: rest.shippingAddressLine1,
    shipping_address_line2: rest.shippingAddressLine2 ?? null,
    city: rest.city,
    state: rest.state,
    pincode: rest.pincode,
    landmark: rest.landmark ?? null,
    admin_notes: rest.adminNotes ?? null,
    payment_status: rest.paymentStatus ?? null,
    status: rest.status ?? null,
    delivery_status: rest.deliveryStatus ?? null,
    expected_delivery_date: rest.expectedDeliveryDate ? rest.expectedDeliveryDate : null,
    tracking_link: rest.trackingLink ?? null,
  };
  const { error } = await supabase.from("orders").update(updatePayload).eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/drop-shipping");
  return { success: true };
}
