"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteRequest {
  entity: string;
  payload: Record<string, unknown>;
}

interface DeleteConfirmButtonProps {
  entityLabel: string;
  request: DeleteRequest;
}

export function DeleteConfirmButton({ entityLabel, request }: DeleteConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (input !== "DELETE") {
      toast.error("Type DELETE exactly to confirm.");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          toast.error(result.message ?? "Unable to delete.");
          return;
        }
        toast.success(`${entityLabel} deleted`);
        setIsConfirming(false);
        setInput("");
      } catch (error) {
        console.error(error);
        toast.error("Delete failed.");
      }
    });
  };

  if (!isConfirming) {
    return (
      <Button type="button" variant="danger" size="sm" onClick={() => setIsConfirming(true)}>
        <span className="inline-flex items-center gap-1">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </span>
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3 text-sm text-rose-800">
      <p>Type DELETE to remove this {entityLabel} permanently.</p>
      <input
          value={input}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          placeholder="DELETE"
          className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm uppercase"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsConfirming(false);
            setInput("");
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={input !== "DELETE" || isPending}
        >
          {isPending ? "Deleting..." : "Confirm delete"}
        </Button>
      </div>
    </div>
  );
}
