"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { upsertLead, type LeadFormValues } from "@/actions/leads";
import { leadFormSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";

const sources = ["LinkedIn", "Email", "Referral", "Website", "Other"] as const;
const statuses = ["New", "Contacted", "Proposal Sent", "Won", "Lost"] as const;

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localIso = new Date(date.getTime() - tzOffset).toISOString();
  return localIso.slice(0, 16);
};

export function LeadForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: Partial<LeadFormValues>;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const initialValues = useMemo<LeadFormValues>(
    () => ({
      id: undefined,
      name: "",
      company: "",
      email: "",
      source: "LinkedIn",
      status: "New",
      phone: "",
      industry: "",
      country: "",
      notes: "",
      nextFollowUp: "",
      coldEmailSentFlag: null,
      coldEmailSentTs: "",
    }),
    [],
  );
  const normalizedDefaults = useMemo(
    () => ({
      ...defaultValues,
      coldEmailSentFlag: defaultValues?.coldEmailSentFlag ?? null,
      coldEmailSentTs: toDateTimeLocal(defaultValues?.coldEmailSentTs ?? null),
    }),
    [defaultValues],
  );
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { ...initialValues, ...normalizedDefaults },
  });
  useEffect(() => {
    form.reset({ ...initialValues, ...normalizedDefaults });
  }, [defaultValues, form, initialValues, normalizedDefaults]);
  const isEditing = Boolean(defaultValues?.id);

  const onSubmit = (values: LeadFormValues) => {
    const payload: LeadFormValues = {
      ...values,
      coldEmailSentFlag: values.coldEmailSentFlag ?? null,
      coldEmailSentTs: values.coldEmailSentTs
        ? new Date(values.coldEmailSentTs).toISOString()
        : null,
    };
    startTransition(async () => {
      const result = await upsertLead(payload);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save lead");
        return;
      }
      toast.success("Lead saved");
      form.reset(initialValues);
      onSuccess?.();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="card space-y-5 p-6"
    >
      <input type="hidden" {...form.register("id")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-600">Name</label>
          <input
            {...form.register("name")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Lead contact"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Company</label>
          <input
            {...form.register("company")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Organization"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Email</label>
          <input
            type="email"
            {...form.register("email")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="contact@company.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Phone</label>
          <input
            {...form.register("phone")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="+1 555..."
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Source</label>
          <select
            {...form.register("source")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {sources.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Status</label>
          <select
            {...form.register("status")}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
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
          <label className="text-sm font-medium text-zinc-600">Cold email sent?</label>
          <select
            {...form.register("coldEmailSentFlag", {
              setValueAs: (val) => {
                return val === "true";
              },
            })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="true">Yes — initial email sent</option>
            <option value="false">No — outreach pending</option>
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            Tracks whether the first cold outreach has gone out.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Cold email sent at</label>
          <input
            type="datetime-local"
            {...form.register("coldEmailSentTs", {
              setValueAs: (val) => (val ? val : ""),
            })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Optional timestamp for when the initial email was sent.
          </p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Notes</label>
        <textarea
          {...form.register("notes")}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          rows={3}
          placeholder="Call notes, next steps..."
        />
      </div>
      <div className="flex justify-end gap-2">
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset(initialValues);
              onSuccess?.();
            }}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Update lead" : "Save lead"}
        </Button>
      </div>
    </form>
  );
}
