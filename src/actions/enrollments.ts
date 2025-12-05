'use server';

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { studentEnrollmentSchema } from "@/lib/validation";

export type StudentEnrollmentFormValues = z.infer<typeof studentEnrollmentSchema>;

export async function updateStudentEnrollment(values: StudentEnrollmentFormValues) {
  const payload = studentEnrollmentSchema.parse(values);
  if (isDemoMode) {
    console.info("Demo mode: skip updating enrollment", payload);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { id, ...rest } = payload;
  const { error } = await supabase
    .from("student_enrollments")
    .update({
      full_name: rest.fullName,
      email: rest.email,
      phone: rest.phone ?? null,
      country: rest.country ?? null,
      current_role: rest.currentRole ?? null,
      experience_years: rest.experienceYears ?? null,
      motivation: rest.motivation ?? null,
      course_code: rest.courseCode,
      batch_label: rest.batchLabel,
      enrollment_type: rest.enrollmentType,
      payment_status: rest.paymentStatus,
      lead_source: rest.leadSource,
      is_demo_only: rest.isDemoOnly ?? false,
      batch_schedule: rest.batchSchedule ?? null,
    })
    .eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/courses");
  return { success: true };
}

export async function deleteStudentEnrollment(id: number | string) {
  const numericId = Number(id);
  if (!numericId) {
    return { success: false, message: "Enrollment id is required." };
  }
  if (isDemoMode) {
    console.info("Demo mode: pretend deleting enrollment", numericId);
    return { success: true };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase client unavailable." };
  }
  const { error } = await supabase.from("student_enrollments").delete().eq("id", numericId);
  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath("/courses");
  return { success: true };
}
