"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import type { Employee, TimeEntry } from "@/lib/types";
import { TimeEntryForm } from "@/components/forms/task-form";
import { Button } from "@/components/ui/button";

export function UpdateTimeEntryDrawer({
  entries,
  employees,
}: {
  entries: TimeEntry[];
  employees: Employee[];
}) {
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-muted)]">
        No time entries for this project yet.
      </p>
    );
  }
  return (
    <div className="space-y-2 text-sm">
      {entries.map((entry) => {
        const note = entry.notes ?? "";
        const shortNote = note.slice(0, 50);
        const showMore = note.length > 50;
        const isExpanded = expanded === entry.id;
        const displayNote = isExpanded ? note : shortNote;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => setEditing(entry)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/50 bg-[var(--color-surface-muted)]/80 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:bg-white"
          >
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">{entry.employeeName}</p>
              <p className="text-xs text-[var(--color-muted)]">{formatDate(entry.date)}</p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold uppercase text-[var(--color-muted)]">
                {entry.projectName && (
                  <span className="chip bg-white px-2 py-0.5 text-[var(--color-foreground)]">
                    {entry.projectName}
                  </span>
                )}
                {entry.taskName && (
                  <span className="chip bg-white px-2 py-0.5 text-[var(--color-foreground)]">
                    {entry.taskName}
                  </span>
                )}
              </div>
              {note && (
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {displayNote}
                  {showMore && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpanded(isExpanded ? null : entry.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setExpanded(isExpanded ? null : entry.id);
                        }
                      }}
                      className="ml-1 cursor-pointer text-[var(--color-primary)] underline"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </span>
                  )}
                </p>
              )}
            </div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{entry.hours}h</p>
          </button>
        );
      })}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">Edit time entry</p>
                <p className="text-xs text-[var(--color-muted)]">{editing.employeeName}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Close
              </Button>
            </div>
            <div className="mt-3">
              <TimeEntryForm
                taskId={editing.taskId}
                employees={employees}
                defaultEmployeeId={editing.employeeId}
                defaultValues={{
                  id: editing.id,
                  taskId: editing.taskId,
                  employeeId: editing.employeeId,
                  employeeRecordId: editing.employeeRecordId,
                  employeeName: editing.employeeName,
                  date: editing.date,
                  hours: editing.hours,
                  notes: editing.notes,
                }}
                onSuccess={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
