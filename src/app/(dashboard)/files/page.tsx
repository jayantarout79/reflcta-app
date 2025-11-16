import { DocumentUploadForm } from "@/components/forms/document-form";
import { DocumentMetaForm } from "@/components/forms/document-meta-form";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import { getFiles, getCurrentUserProfile } from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export default async function FilesPage() {
  const [files, user] = await Promise.all([getFiles(), getCurrentUserProfile()]);
  const canUpload = user ? canAccess(user.role, "files", "create") : false;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">Contracts, NDAs, invoices</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Files & documents</h1>
        <p className="mt-2 text-xs text-zinc-500">
          Uploads require a Supabase Storage bucket named <span className="font-semibold">documents</span> with public read access. Create the bucket in Supabase →
          Storage, enable RLS, and grant authenticated users insert/select before using this form.
        </p>
      </div>
      {canUpload && (
        <DocumentUploadForm linkedEntityId={user?.id} uploaderName={user?.name ?? user?.email} />
      )}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {files.map((file) => (
            <div key={file.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 space-y-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{file.fileName}</p>
                <p className="text-xs text-zinc-500">
                  {file.category} • {file.linkedType}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Uploaded {formatDate(file.uploadedAt)} by {file.uploadedBy ?? "Unknown"}
                </p>
              </div>
              {file.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs font-semibold text-emerald-600"
                >
                  Open file →
                </a>
              )}
              {canUpload && (
                <div className="space-y-2">
                  <details>
                    <summary className="cursor-pointer text-xs font-semibold text-zinc-500">
                      Edit metadata
                    </summary>
                    <div className="mt-2 rounded-2xl bg-white p-3">
                      <DocumentMetaForm
                        documentId={file.id}
                        defaultValues={{
                          linkedType: file.linkedType,
                          linkedEntityId: file.linkedEntityId,
                          category: file.category,
                        }}
                      />
                    </div>
                  </details>
                  <div className="text-right">
                    <DeleteConfirmButton
                      entityLabel={file.fileName}
                      request={{
                        entity: "document",
                        payload: { id: file.id, storagePath: file.storagePath },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
