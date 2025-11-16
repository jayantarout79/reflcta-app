"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import type { Employee, TimeEntry } from "@/lib/types";
import { TimeEntryForm } from "@/components/forms/task-form";

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
      <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
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
            className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-left hover:bg-zinc-100"
          >
            <div>
              <p className="font-medium text-zinc-800">{entry.employeeName}</p>
              <p className="text-xs text-zinc-500">{formatDate(entry.date)}</p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold uppercase text-zinc-500">
                {entry.projectName && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-700">
                    {entry.projectName}
                  </span>
                )}
                {entry.taskName && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-700">
                    {entry.taskName}
                  </span>
                )}
              </div>
              {note && (
                <p className="mt-1 text-xs text-zinc-500">
                  {displayNote}
                  {showMore && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpanded(isExpanded ? null : entry.id);
                      }}
                      className="ml-1 text-emerald-600 underline"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </p>
              )}
            </div>
            <p className="text-sm font-semibold">{entry.hours}h</p>
          </button>
        );
      })}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Edit time entry</p>
                <p className="text-xs text-zinc-500">{editing.employeeName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-700"
              >
                Close
              </button>
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
