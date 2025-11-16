"use client";

import { useState } from "react";
import { EmployeeForm } from "@/components/forms/employee-form";
import type { Employee } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { DeleteConfirmButton } from "@/components/delete-confirm";

interface EmployeeCardListProps {
  employees: Employee[];
  canViewSalary: boolean;
  canEdit: boolean;
  canDelete?: boolean;
}

export function EmployeeCardList({
  employees,
  canViewSalary,
  canEdit,
  canDelete = false,
}: EmployeeCardListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {employees.map((employee) => {
        const isEditing = editingId === employee.id;
        if (isEditing) {
          return (
            <div key={employee.id} className="rounded-3xl border border-zinc-100 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">Edit {employee.name}</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                    >
                      Cancel
                    </button>
                    {canDelete && (
                      <DeleteConfirmButton
                        entityLabel={employee.name}
                        request={{ entity: "employee", payload: { id: employee.id } }}
                      />
                    )}
                  </div>
                </div>
              <EmployeeForm
                defaultValues={{
                  id: employee.id,
                  name: employee.name,
                  email: employee.email,
                  role: employee.role,
                  jobTitle: employee.jobTitle,
                  location: employee.location,
                  joinDate: employee.joinDate,
                  employmentType: employee.employmentType,
                  status: employee.status,
                  salary: employee.salary,
                  skills: employee.skills,
                  notes: employee.notes,
                }}
                onSuccess={() => setEditingId(null)}
              />
            </div>
          );
        }
        return (
          <article
            key={employee.id}
            className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {employee.status}
                </span>
                <p className="mt-2 text-lg font-semibold text-zinc-900">{employee.name}</p>
                <p className="text-xs text-zinc-500">{employee.jobTitle ?? "Role TBD"}</p>
              </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditingId(employee.id)}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            Edit
          </button>
        )}
        {canDelete && (
          <DeleteConfirmButton
            entityLabel={employee.name}
            request={{ entity: "employee", payload: { id: employee.id } }}
          />
        )}
      </div>
            <div className="grid gap-2 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
              <p>
                Employment <span className="font-semibold">{employee.employmentType}</span>
              </p>
              <p>
                Role <span className="font-semibold">{employee.role}</span>
              </p>
              <p>
                Location <span className="font-semibold">{employee.location ?? "—"}</span>
              </p>
              <p>
                Email{" "}
                <a className="font-semibold text-emerald-600" href={`mailto:${employee.email}`}>
                  {employee.email}
                </a>
              </p>
              {canViewSalary && employee.salary && (
                <p>
            Salary{" "}
            <span className="font-semibold text-emerald-600">
              ₹{employee.salary.toLocaleString("en-IN")}
            </span>
                </p>
              )}
            </div>
            <div className="text-xs text-zinc-500">
              Joined {formatDate(employee.joinDate)} • Skills:{" "}
              {(employee.skills ?? []).filter(Boolean).join(", ") || "n/a"}
            </div>
          </article>
        );
      })}
    </div>
  );
}
