"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { documentFormSchema } from "@/lib/validation";
import { updateDocumentMeta } from "@/actions/files";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const documentMetaSchema = documentFormSchema.extend({
  id: z.string(),
});

type DocumentMetaValues = z.infer<typeof documentMetaSchema>;

const categories = [
  "Contract",
  "NDA",
  "Proposal",
  "Report",
  "Invoice PDF",
  "Receipt",
  "Misc",
] as const;

const linkedTypes = ["Client", "Project", "Invoice", "Employee", "Generic"] as const;

export function DocumentMetaForm({
  documentId,
  defaultValues,
  onSuccess,
}: {
  documentId: string;
  defaultValues: Omit<DocumentMetaValues, "id">;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<DocumentMetaValues>({
    resolver: zodResolver(documentMetaSchema),
    defaultValues: { id: documentId, ...defaultValues },
  });
  const handleSubmit = (values: DocumentMetaValues) => {
    startTransition(async () => {
      const result = await updateDocumentMeta(values);
      if (!result.success) {
        toast.error(result.message ?? "Unable to update document");
        return;
      }
      toast.success("Document updated");
      onSuccess?.();
    });
  };
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
      <input type="hidden" {...form.register("id")} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-500">Linked type</label>
          <select
            {...form.register("linkedType")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {linkedTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Category</label>
          <select
            {...form.register("category")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-500">Linked entity ID</label>
        <input
          {...form.register("linkedEntityId")}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Optional ID"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save metadata"}
        </Button>
      </div>
    </form>
  );
}
