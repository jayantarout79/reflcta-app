"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { upsertClient, type ClientFormValues } from "@/actions/clients";
import { clientFormSchema } from "@/lib/validation";

const relationshipOptions = ["Active", "Dormant", "Past", "High-Risk"] as const;

export function ClientForm({
  defaultValues,
}: {
  defaultValues?: Partial<ClientFormValues>;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      company: "",
      primaryContact: "",
      email: "",
      relationshipStatus: "Active",
      ...defaultValues,
    },
  });

  const onSubmit = (values: ClientFormValues) => {
    startTransition(async () => {
      const result = await upsertClient(values);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save client");
        return;
      }
      toast.success("Client saved");
      if (!values.id) form.reset();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-600">Client name</label>
          <input
            {...form.register("name")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Company</label>
          <input
            {...form.register("company")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Primary contact</label>
          <input
            {...form.register("primaryContact")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Email</label>
          <input
            type="email"
            {...form.register("email")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Phone</label>
          <input
            {...form.register("phone")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Website</label>
          <input
            {...form.register("website")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="https://"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Industry</label>
          <input
            {...form.register("industry")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Country</label>
          <input
            {...form.register("country")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Timezone</label>
          <input
            {...form.register("timezone")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Relationship</label>
          <select
            {...form.register("relationshipStatus")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {relationshipOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Notes</label>
        <textarea
          {...form.register("notes")}
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save client"}
        </button>
      </div>
    </form>
  );
}
