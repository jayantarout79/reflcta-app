'use server';

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type AuthFormState = { message?: string | null };

export async function signInAction(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { message: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  if (isDemoMode) {
    redirect("/dashboard");
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { message: "Supabase client unavailable." };
  }
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { message: error.message };
  }
  redirect("/dashboard");
}

export async function signOutAction() {
  if (isDemoMode) {
    redirect("/login");
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable.");
  }
  await supabase.auth.signOut();
  revalidatePath("/login");
  redirect("/login");
}
