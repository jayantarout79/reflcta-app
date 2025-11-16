"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { Client } from "@/lib/types";

export function ProposalForm({ clients }: { clients: Client[] }) {
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    setProposal("");
    try {
      const response = await fetch("/api/ai/proposal", {
        method: "POST",
        body: JSON.stringify({
          clientName: formData.get("clientName"),
          projectType: formData.get("projectType"),
          problemStatement: formData.get("problemStatement"),
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to generate proposal");
      }
      const json = await response.json();
      setProposal(json.proposal);
    } catch (error) {
      console.error(error);
      toast.error("OpenAI call failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-zinc-600">
              Select client
            </label>
            <select
              name="clientName"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              {clients.map((client) => (
                <option key={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-600">Project type</label>
            <input
              name="projectType"
              required
              placeholder="Automation, analytics, copilot..."
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">
            Rough problem statement
          </label>
          <textarea
            name="problemStatement"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Describe the desired AI solution, goals, constraints..."
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? "Calling OpenAI..." : "Generate proposal draft"}
          </button>
        </div>
      </form>
      {proposal && (
        <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Draft output
          </p>
          <div className="prose prose-sm mt-2 whitespace-pre-wrap text-zinc-800">
            {proposal}
          </div>
        </div>
      )}
    </div>
  );
}
