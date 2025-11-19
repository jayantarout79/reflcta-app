"use client";

import { useState } from "react";
import type { ClientFormValues } from "@/actions/clients";
import { ClientForm } from "@/components/forms/client-form";
import { Button } from "@/components/ui/button";

export function ClientProfileEditor({
  defaultValues,
}: {
  defaultValues: Partial<ClientFormValues>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const toggle = () => setIsEditing((prev) => !prev);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Client profile
          </p>
          <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">Account details</h2>
          <p className="text-xs text-[var(--color-muted)]">
            Keep relationship status and contact details current.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={toggle}>
          {isEditing ? "Close" : "Edit client"}
        </Button>
      </div>
      {isEditing && (
        <div className="mt-4">
          <ClientForm defaultValues={defaultValues} onSuccess={() => setIsEditing(false)} />
        </div>
      )}
    </div>
  );
}
