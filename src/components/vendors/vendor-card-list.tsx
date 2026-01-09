"use client";

import { useState } from "react";
import { VendorForm } from "@/components/forms/vendor-form";
import type { Vendor } from "@/lib/types";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import { Button } from "@/components/ui/button";

interface VendorCardListProps {
  vendors: Vendor[];
  canEdit: boolean;
  canDelete?: boolean;
}

export function VendorCardList({ vendors, canEdit, canDelete = false }: VendorCardListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {vendors.map((vendor) => {
        const isEditing = editingId === vendor.id;
        if (isEditing) {
          return (
            <div key={vendor.id} className="card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                  Edit {vendor.name}
                </h3>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  {canDelete && (
                    <DeleteConfirmButton
                      entityLabel={vendor.name}
                      request={{ entity: "vendor", payload: { id: vendor.id } }}
                    />
                  )}
                </div>
              </div>
              <VendorForm
                defaultValues={{
                  id: vendor.id,
                  name: vendor.name,
                  company: vendor.company,
                  email: vendor.email,
                  phone: vendor.phone,
                  website: vendor.website,
                  country: vendor.country,
                  notes: vendor.notes,
                }}
                onSuccess={() => setEditingId(null)}
              />
            </div>
          );
        }

        return (
          <article key={vendor.id} className="card space-y-4 p-6" data-hover="true">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                  {vendor.company ?? "Vendor"}
                </p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
                  {vendor.name}
                </p>
                <p className="text-sm text-[var(--color-muted)]">{vendor.country ?? "Country TBD"}</p>
              </div>
              {canEdit && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(vendor.id)}>
                  Edit
                </Button>
              )}
              {canDelete && (
                <DeleteConfirmButton
                  entityLabel={vendor.name}
                  request={{ entity: "vendor", payload: { id: vendor.id } }}
                />
              )}
            </div>
            <div className="grid gap-2 rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/80 p-3 text-sm text-[var(--color-muted)]">
              <p>
                Email{" "}
                <a className="font-semibold text-[var(--color-primary)]" href={`mailto:${vendor.email ?? ""}`}>
                  {vendor.email ?? "—"}
                </a>
              </p>
              <p>
                Phone <span className="font-semibold">{vendor.phone ?? "—"}</span>
              </p>
              <p>
                Website{" "}
                {vendor.website ? (
                  <a
                    className="font-semibold text-[var(--color-primary)]"
                    href={vendor.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {vendor.website}
                  </a>
                ) : (
                  <span className="font-semibold">—</span>
                )}
              </p>
            </div>
            <p className="text-xs text-[var(--color-muted)]">{vendor.notes ?? "No notes yet."}</p>
          </article>
        );
      })}
    </div>
  );
}
