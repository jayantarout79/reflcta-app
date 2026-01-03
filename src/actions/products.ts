"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { productFormSchema } from "@/lib/validation";
import type { z } from "zod";

export type ProductFormValues = z.infer<typeof productFormSchema>;

const PRODUCTS_BUCKET = "product-assets";

export async function upsertProduct(values: ProductFormValues) {
  const payload = productFormSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skipping product upsert", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { id, ...rest } = payload;
  const dbPayload = {
    external_product_id: rest.externalProductId ?? null,
    name: rest.name,
    subtitle: rest.subtitle ?? null,
    product_type: rest.productType ?? null,
    design_sku: rest.designSku ?? null,
    base_sku: rest.baseSku ?? null,
    image_path: rest.imagePath ?? null,
    image_path2: rest.imagePath2 ?? null,
    image_path3: rest.imagePath3 ?? null,
    product_cost: rest.productCost ?? null,
    selling_cost: rest.sellingCost ?? null,
    active: rest.active ?? true,
    display_order: rest.displayOrder ?? 0,
    product_details: rest.productDetails ?? null,
    product_display_name: rest.productDisplayName ?? null,
  };
  const query = supabase.from("products");
  const response = id
    ? await query.update(dbPayload).eq("id", id).single()
    : await query.insert(dbPayload).single();
  if (response.error) {
    return { success: false, message: response.error.message };
  }
  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  if (!id) return { success: false, message: "Product id required." };
  if (isDemoMode) {
    console.info("Demo mode: skipping product delete", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/products");
  return { success: true };
}

export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, message: "File is required." };
  if (isDemoMode) {
    return {
      success: true,
      publicUrl: "https://example.com/demo-product-image.jpg",
      path: "products/demo-product-image.jpg",
    };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const path = `${crypto.randomUUID()}-${file.name}`;
  const uploadResult = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadResult.error) {
    return { success: false, message: uploadResult.error.message };
  }
  const publicUrl = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path);
  return { success: true, publicUrl: publicUrl.data.publicUrl, path };
}

function pathFromUrl(url?: string | null) {
  if (!url) return null;
  const marker = "/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function deleteProductImage(imageUrl?: string | null) {
  if (!imageUrl) return { success: true };
  if (isDemoMode) {
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const path = pathFromUrl(imageUrl);
  if (!path) return { success: true };
  await supabase.storage.from(PRODUCTS_BUCKET).remove([path]);
  return { success: true };
}
