"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { convertLeadToClient } from "@/actions/leads";
import { Button } from "@/components/ui/button";

export function ConvertLeadButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
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
    >
      {isPending ? (
        "Converting..."
      ) : (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Mark won
        </span>
      )}
    </Button>
  );
}
