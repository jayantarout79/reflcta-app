"use client";

import { useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import type { Lead } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { LeadForm } from "@/components/forms/lead-form";
import { ConvertLeadButton } from "./convert-lead-button";
import { Button } from "@/components/ui/button";

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
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                {editingLead ? "Update lead" : "New lead"}
              </p>
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                {editingLead ? editingLead.company : "Capture opportunity"}
              </h2>
            </div>
            {editingLead && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingLead(null)}>
                Clear selection
              </Button>
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
      <div className="card p-4">
        <div className="grid gap-4 lg:grid-cols-5">
          {grouped.map(({ status, items }) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-[var(--color-surface-muted)] px-3 py-2">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">{status}</p>
                <span className="chip bg-white px-2 py-0.5 text-xs text-[var(--color-muted)]">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-white/60 bg-white/80 p-3 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{lead.company}</p>
                        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                          {lead.name}
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingLead(lead)}
                          aria-label={`Edit ${lead.company}`}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      Next follow-up {formatDate(lead.nextFollowUp)}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">Source • {lead.source}</p>
                    {(canConvert && (status === "Proposal Sent" || status === "Contacted")) && (
                      <div className="mt-3">
                        <ConvertLeadButton leadId={lead.id} />
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-xs text-[var(--color-muted)]">
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
