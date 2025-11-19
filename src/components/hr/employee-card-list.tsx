"use client";

import { useState } from "react";
import { EmployeeForm } from "@/components/forms/employee-form";
import type { Employee } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import { Button } from "@/components/ui/button";

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
            <div key={employee.id} className="card p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                    Edit {employee.name}
                  </h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
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
          <article key={employee.id} className="card space-y-4 p-6" data-hover="true">
            <div className="flex items-center justify-between">
              <div>
                <span className="chip bg-emerald-50 px-3 py-1 text-emerald-700">
                  {employee.status}
                </span>
                <p className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">{employee.name}</p>
                <p className="text-xs text-[var(--color-muted)]">{employee.jobTitle ?? "Role TBD"}</p>
              </div>
              {canEdit && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(employee.id)}>
                  Edit
                </Button>
              )}
              {canDelete && (
                <DeleteConfirmButton
                  entityLabel={employee.name}
                  request={{ entity: "employee", payload: { id: employee.id } }}
                />
              )}
            </div>
            <div className="grid gap-2 rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/80 p-3 text-sm text-[var(--color-muted)]">
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
                <a className="font-semibold text-[var(--color-primary)]" href={`mailto:${employee.email}`}>
                  {employee.email}
                </a>
              </p>
              {canViewSalary && employee.salary && (
                <p>
                  Salary{" "}
                  <span className="font-semibold text-[var(--color-primary)]">
                    ₹{employee.salary.toLocaleString("en-IN")}
                  </span>
                </p>
              )}
            </div>
            <div className="text-xs text-[var(--color-muted)]">
              Joined {formatDate(employee.joinDate)} • Skills:{" "}
              {(employee.skills ?? []).filter(Boolean).join(", ") || "n/a"}
            </div>
          </article>
        );
      })}
    </div>
  );
}
