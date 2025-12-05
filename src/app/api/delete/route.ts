"use server";

import { NextResponse } from "next/server";
import { deleteClient } from "@/actions/clients";
import { deleteProject } from "@/actions/projects";
import { deleteTask } from "@/actions/tasks";
import { deleteExpense } from "@/actions/finance";
import { deleteEmployee } from "@/actions/hr";
import { deleteDocument } from "@/actions/files";
import { deleteStudentEnrollment } from "@/actions/enrollments";

export async function POST(request: Request) {
  const body = await request.json();
  const { entity, payload } = body as {
    entity: string;
    payload: Record<string, unknown>;
  };
  let result: { success: boolean; message?: string } = {
    success: false,
    message: "Unknown entity",
  };
  try {
    switch (entity) {
      case "client":
        result = await deleteClient(payload.id as string);
        break;
      case "project":
        result = await deleteProject(payload.id as string);
        break;
      case "task":
        result = await deleteTask(payload.id as string, payload.projectId as string | undefined);
        break;
      case "expense":
        result = await deleteExpense(payload.id as string);
        break;
    case "employee":
      result = await deleteEmployee(payload.id as string);
      break;
    case "document":
      result = await deleteDocument(payload.id as string, payload.storagePath as string | undefined);
      break;
    case "studentEnrollment":
      result = await deleteStudentEnrollment(payload.id as number);
      break;
      default:
        result = { success: false, message: "Unsupported delete entity." };
    }
  } catch (error) {
    console.error("Delete API error", error);
    result = { success: false, message: "Delete failed." };
  }
  return NextResponse.json(
    { success: result.success, message: result.message ?? "" },
    { status: result.success ? 200 : 400 },
  );
}
