"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { uploadDocument } from "@/actions/files";

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

export function DocumentUploadForm({
  linkedEntityId,
  uploaderName,
}: {
  linkedEntityId?: string;
  uploaderName?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (linkedEntityId) {
      formData.set("linkedEntityId", linkedEntityId);
    }
    if (uploaderName) {
      formData.set("uploadedBy", uploaderName);
    }
    setLoading(true);
    try {
      const result = await uploadDocument(formData);
      if (!result.success) {
        toast.error(result.message ?? "Upload failed");
      } else {
        toast.success("File uploaded");
        event.currentTarget.reset();
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to save file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-600">Linked type</label>
          <select
            name="linkedType"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            defaultValue="Generic"
          >
            {linkedTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-600">Category</label>
          <select
            name="category"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            defaultValue="Contract"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600">Attachment</label>
        <input
          type="file"
          name="file"
          required
          className="mt-1 w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Uploading..." : "Upload file"}
        </button>
      </div>
    </form>
  );
}
