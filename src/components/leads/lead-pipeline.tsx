"use client";

import { useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import type { Lead } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { LeadForm } from "@/components/forms/lead-form";
import { ConvertLeadButton } from "./convert-lead-button";

const columns = ["New", "Contacted", "Proposal Sent", "Won", "Lost"] as const;

interface LeadPipelineProps {
  leads: Lead[];
  canEdit: boolean;
  canConvert: boolean;
}

export function LeadPipelineBoard({ leads, canEdit, canConvert }: LeadPipelineProps) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const grouped = useMemo(
    () =>
      columns.map((status) => ({
        status,
        items: leads.filter((lead) => lead.status === status),
      })),
    [leads],
  );

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {editingLead ? "Update lead" : "New lead"}
              </p>
              <h2 className="text-lg font-semibold text-zinc-900">
                {editingLead ? editingLead.company : "Capture opportunity"}
              </h2>
            </div>
            {editingLead && (
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900"
              >
                Clear selection
              </button>
            )}
          </div>
          <div className="mt-4">
            <LeadForm
              defaultValues={editingLead ?? undefined}
              onSuccess={() => setEditingLead(null)}
            />
          </div>
        </div>
      )}
      <div className="rounded-3xl border border-zinc-100 bg-white/70 p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-5">
          {grouped.map(({ status, items }) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2">
                <p className="text-sm font-semibold text-zinc-900">{status}</p>
                <span className="rounded-full bg-zinc-200/60 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-zinc-100 bg-white/80 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{lead.company}</p>
                        <p className="text-xs uppercase tracking-wide text-zinc-400">
                          {lead.name}
                        </p>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditingLead(lead)}
                          className="rounded-full bg-zinc-100 p-1 text-zinc-500 transition hover:bg-zinc-200"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      Next follow-up {formatDate(lead.nextFollowUp)}
                    </p>
                    <p className="text-xs text-zinc-500">Source • {lead.source}</p>
                    {(canConvert && (status === "Proposal Sent" || status === "Contacted")) && (
                      <div className="mt-3">
                        <ConvertLeadButton leadId={lead.id} />
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-400">
                    No leads in this stage
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
