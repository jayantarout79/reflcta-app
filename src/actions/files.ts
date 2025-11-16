'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { documentFormSchema } from "@/lib/validation";
import { z } from "zod";

export async function uploadDocument(formData: FormData) {
  const linkedType = formData.get("linkedType");
  const validation = documentFormSchema.safeParse({
    linkedType,
    linkedEntityId: formData.get("linkedEntityId")?.toString(),
    category: formData.get("category"),
    uploadedBy: formData.get("uploadedBy")?.toString(),
  });
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.errors[0]?.message ?? "Invalid data.",
    };
  }
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, message: "File is required." };
  }
  if (isDemoMode) {
    console.info("Demo mode: skipping upload", validation.data);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const path = `documents/${crypto.randomUUID()}-${file.name}`;
  const uploadResult = await supabase.storage
    .from("documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadResult.error) {
    return { success: false, message: uploadResult.error.message };
  }
  const publicUrl = supabase.storage.from("documents").getPublicUrl(path);
  const { error } = await supabase.from("documents").insert({
    file_name: file.name,
    storage_path: path,
    linked_type: validation.data.linkedType,
    linked_entity_id: validation.data.linkedEntityId,
    category: validation.data.category,
    uploaded_by: validation.data.uploadedBy,
    url: publicUrl.data.publicUrl,
  });
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/files");
  return { success: true };
}

const documentMetaSchema = documentFormSchema.extend({
  id: z.string(),
});

export async function updateDocumentMeta(values: z.infer<typeof documentMetaSchema>) {
  const payload = documentMetaSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skipping document update", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { error } = await supabase
    .from("documents")
    .update({
      linked_type: payload.linkedType,
      linked_entity_id: payload.linkedEntityId,
      category: payload.category,
    })
    .eq("id", payload.id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/files");
  return { success: true };
}

export async function deleteDocument(id: string, storagePath?: string) {
  if (!id) return { success: false, message: "Document id required." };
  if (isDemoMode) {
    console.info("Demo mode: skipping delete document", id);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  if (storagePath) {
    await supabase.storage.from("documents").remove([storagePath]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/files");
  return { success: true };
}
