"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";

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
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="text-xs font-semibold text-rose-600 hover:text-rose-800"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      <p>Type DELETE to remove this {entityLabel} permanently.</p>
      <input
          value={input}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          placeholder="DELETE"
          className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm uppercase"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setIsConfirming(false);
            setInput("");
          }}
          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={input !== "DELETE" || isPending}
          className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Deleting..." : "Confirm delete"}
        </button>
      </div>
    </div>
  );
}
