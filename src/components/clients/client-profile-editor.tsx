"use client";

import { useState } from "react";
import type { ClientFormValues } from "@/actions/clients";
import { ClientForm } from "@/components/forms/client-form";

export function ClientProfileEditor({
  defaultValues,
}: {
  defaultValues: Partial<ClientFormValues>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const toggle = () => setIsEditing((prev) => !prev);

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Client profile</p>
          <h2 className="text-lg font-semibold text-zinc-900">Account details</h2>
          <p className="text-xs text-zinc-500">
            Keep relationship status and contact details current.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
        >
          {isEditing ? "Close" : "Edit client"}
        </button>
      </div>
      {isEditing && (
        <div className="mt-4">
          <ClientForm defaultValues={defaultValues} onSuccess={() => setIsEditing(false)} />
        </div>
      )}
    </div>
  );
}
