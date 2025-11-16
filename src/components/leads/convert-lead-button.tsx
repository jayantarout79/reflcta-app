"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { convertLeadToClient } from "@/actions/leads";

export function ConvertLeadButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const result = await convertLeadToClient(leadId);
          if (!result.success) {
            toast.error(result.message ?? "Unable to convert");
            return;
          }
          toast.success("Lead converted to client");
        })
      }
      disabled={isPending}
      className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-70"
    >
      {isPending ? "Converting..." : "Mark won"}
    </button>
  );
}
