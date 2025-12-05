"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Filter, Search } from "lucide-react";
import type { StudentEnrollment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { studentEnrollmentSchema } from "@/lib/validation";
import type { StudentEnrollmentFormValues } from "@/actions/enrollments";
import { updateStudentEnrollment } from "@/actions/enrollments";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import { Button } from "@/components/ui/button";

interface StudentEnrollmentTableProps {
  enrollments: StudentEnrollment[];
  canEdit: boolean;
}

export function StudentEnrollmentTable({ enrollments, canEdit }: StudentEnrollmentTableProps) {
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rows, setRows] = useState<StudentEnrollment[]>(enrollments);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    setRows(enrollments);
  }, [enrollments]);

  const courseOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.courseCode))).sort(),
    [rows],
  );
  const batchOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.batchLabel))).sort(),
    [rows],
  );
  const leadSources = useMemo(
    () => Array.from(new Set(rows.map((item) => item.leadSource))).sort(),
    [rows],
  );
  const enrollmentTypes = useMemo(
    () => Array.from(new Set(rows.map((item) => item.enrollmentType))).sort(),
    [rows],
  );
  const paymentStatuses = useMemo(
    () => Array.from(new Set(rows.map((item) => item.paymentStatus))).sort(),
    [rows],
  );

  const filtered = rows.filter((item) => {
    const matchesCourse = courseFilter === "all" || item.courseCode === courseFilter;
    const matchesBatch = batchFilter === "all" || item.batchLabel === batchFilter;
    const matchesSearch = searchTerm
      ? item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCourse && matchesBatch && matchesSearch;
  });

  return (
    <div className="card space-y-4 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">Enrollment roster</p>
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
            {filtered.length} students {filtered.length !== rows.length && `(showing of ${rows.length})`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-[var(--color-muted)]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search student name"
              className="w-52 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm">
            <Filter className="h-4 w-4 text-[var(--color-muted)]" />
            <select
              value={courseFilter}
              onChange={(event) => {
                setCourseFilter(event.target.value);
                setBatchFilter("all");
              }}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="all">All courses</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
            <span className="text-[var(--color-border)]">|</span>
            <select
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="all">All batches</option>
              {batchOptions.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-[var(--color-surface-muted)]/70 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course & batch</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Enrollment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((enrollment) => {
              const isEditing = editingId === enrollment.id;
              if (isEditing) {
                return (
                  <tr key={enrollment.id} className="border-t border-[var(--color-border)]/80">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <EnrollmentEditor
                          enrollment={enrollment}
                          onCancel={() => setEditingId(null)}
                          onSaved={(updated) => {
                            setRows((prev) =>
                              prev.map((row) =>
                                row.id === updated.id
                                  ? {
                                      ...row,
                                      ...updated,
                                    }
                                  : row,
                              ),
                            );
                            setEditingId(null);
                          }}
                        />
                        {canEdit && (
                          <div className="lg:w-52">
                            <DeleteConfirmButton
                              entityLabel={enrollment.fullName}
                              request={{ entity: "studentEnrollment", payload: { id: enrollment.id } }}
                              onDeleted={() => {
                                setRows((prev) => prev.filter((row) => row.id !== enrollment.id));
                                setEditingId((current) =>
                                  current === enrollment.id ? null : current,
                                );
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={enrollment.id} className="border-t border-[var(--color-border)]/80">
                  <td className="align-top px-4 py-4">
                    <div className="font-semibold text-[var(--color-foreground)]">
                      {enrollment.fullName}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">****</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      **** · {enrollment.country ?? "Country TBD"}
                    </div>
                  </td>
                  <td className="align-top px-4 py-4">
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {enrollment.courseCode}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">Batch {enrollment.batchLabel}</div>
                    {enrollment.batchSchedule && (
                      <div className="text-xs text-[var(--color-muted)]">{enrollment.batchSchedule}</div>
                    )}
                  </td>
                  <td className="align-top px-4 py-4">
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {enrollment.currentRole ?? "Role TBD"}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {enrollment.experienceYears ? `${enrollment.experienceYears} exp` : "Experience TBD"}
                    </div>
                    <div className="text-xs text-[var(--color-muted)] line-clamp-2">
                      {enrollment.motivation ?? "No motivation captured"}
                    </div>
                  </td>
                  <td className="align-top px-4 py-4">
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {enrollment.enrollmentType}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">Lead: {enrollment.leadSource}</div>
                  </td>
                  <td className="align-top px-4 py-4">
                    <span className="chip bg-[var(--color-surface-muted)] px-3 py-1 text-[var(--color-foreground)]">
                      {enrollment.paymentStatus}
                    </span>
                    {enrollment.isDemoOnly && (
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-600">
                        Demo only
                      </div>
                    )}
                  </td>
                  <td className="align-top px-4 py-4 text-sm text-[var(--color-muted)]">
                    {formatDate(enrollment.createdAt)}
                  </td>
                  <td className="align-top px-4 py-4 text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(enrollment.id)}
                        >
                          Edit
                        </Button>
                        <DeleteConfirmButton
                          entityLabel={enrollment.fullName}
                          request={{ entity: "studentEnrollment", payload: { id: enrollment.id } }}
                        />
                      </div>
                    )}
                    {!canEdit && <span className="text-xs text-[var(--color-muted)]">Read-only</span>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                  No enrollments match these filters yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <datalist id="course-options">
        {courseOptions.map((course) => (
          <option key={course} value={course} />
        ))}
      </datalist>
      <datalist id="batch-options">
        {batchOptions.map((batch) => (
          <option key={batch} value={batch} />
        ))}
      </datalist>
      <datalist id="lead-sources">
        {leadSources.map((source) => (
          <option key={source} value={source} />
        ))}
      </datalist>
      <datalist id="enrollment-types">
        {enrollmentTypes.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <datalist id="payment-statuses">
        {paymentStatuses.map((status) => (
          <option key={status} value={status} />
        ))}
      </datalist>
    </div>
  );
}

interface EnrollmentEditorProps {
  enrollment: StudentEnrollment;
  onSaved: (updated: StudentEnrollmentFormValues) => void;
  onCancel: () => void;
}

function EnrollmentEditor({
  enrollment,
  onSaved,
  onCancel,
}: EnrollmentEditorProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<StudentEnrollmentFormValues>({
    resolver: zodResolver(studentEnrollmentSchema),
    defaultValues: {
      id: enrollment.id,
      fullName: enrollment.fullName,
      email: enrollment.email,
      phone: enrollment.phone ?? "",
      country: enrollment.country ?? "",
      currentRole: enrollment.currentRole ?? "",
      experienceYears: enrollment.experienceYears ?? "",
      motivation: enrollment.motivation ?? "",
      courseCode: enrollment.courseCode,
      batchLabel: enrollment.batchLabel,
      enrollmentType: enrollment.enrollmentType,
      paymentStatus: enrollment.paymentStatus,
      leadSource: enrollment.leadSource,
      isDemoOnly: enrollment.isDemoOnly,
      batchSchedule: enrollment.batchSchedule ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      id: enrollment.id,
      fullName: enrollment.fullName,
      email: enrollment.email,
      phone: enrollment.phone ?? "",
      country: enrollment.country ?? "",
      currentRole: enrollment.currentRole ?? "",
      experienceYears: enrollment.experienceYears ?? "",
      motivation: enrollment.motivation ?? "",
      courseCode: enrollment.courseCode,
      batchLabel: enrollment.batchLabel,
      enrollmentType: enrollment.enrollmentType,
      paymentStatus: enrollment.paymentStatus,
      leadSource: enrollment.leadSource,
      isDemoOnly: enrollment.isDemoOnly,
      batchSchedule: enrollment.batchSchedule ?? "",
    });
  }, [enrollment, form]);

  const onSubmit = (values: StudentEnrollmentFormValues) => {
    startTransition(async () => {
      const cleaned: StudentEnrollmentFormValues = {
        ...values,
        phone: values.phone?.trim() || undefined,
        country: values.country?.trim() || undefined,
        currentRole: values.currentRole?.trim() || undefined,
        experienceYears: values.experienceYears?.trim() || undefined,
        motivation: values.motivation?.trim() || undefined,
        batchSchedule: values.batchSchedule?.trim() || undefined,
      };
      const result = await updateStudentEnrollment(cleaned);
      if (!result.success) {
        toast.error(result.message ?? "Unable to update enrollment");
        return;
      }
      toast.success("Enrollment updated");
      onSaved(cleaned);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-[560px] space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-4 text-left">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Full name</label>
          <input
            {...form.register("fullName")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Email</label>
          <input
            value="****"
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-muted)]"
          />
          <input type="hidden" {...form.register("email")} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Phone</label>
          <input
            value="****"
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-muted)]"
          />
          <input type="hidden" {...form.register("phone")} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Country</label>
          <input
            {...form.register("country")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Current role</label>
          <input
            {...form.register("currentRole")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Experience</label>
          <input
            {...form.register("experienceYears")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            placeholder="e.g. 3-5 years"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Course code</label>
          <input
            list="course-options"
            {...form.register("courseCode")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Batch label</label>
          <input
            list="batch-options"
            {...form.register("batchLabel")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Enrollment type</label>
          <input
            list="enrollment-types"
            {...form.register("enrollmentType")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Payment status</label>
          <input
            list="payment-statuses"
            {...form.register("paymentStatus")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Lead source</label>
          <input
            list="lead-sources"
            {...form.register("leadSource")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)]">Batch schedule</label>
          <input
            {...form.register("batchSchedule")}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            placeholder="Weeknights, weekends, etc."
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[var(--color-muted)]">Motivation</label>
        <textarea
          {...form.register("motivation")}
          rows={2}
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
          <input type="checkbox" {...form.register("isDemoOnly")} className="h-4 w-4 rounded border-[var(--color-border)]" />
          Mark as demo-only
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
      <div className="text-[10px] text-[var(--color-muted)]">
        Editing {enrollment.fullName} • {enrollment.courseCode} / {enrollment.batchLabel}
      </div>
    </form>
  );
}
