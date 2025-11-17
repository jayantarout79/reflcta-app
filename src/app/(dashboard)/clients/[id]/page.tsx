import Link from "next/link";
import { notFound } from "next/navigation";
import { AISummary } from "@/components/ai/ai-summary";
import { ClientProfileEditor } from "@/components/clients/client-profile-editor";
import {
  getClientById,
  getProjects,
  getInvoices,
  getCurrentUserProfile,
} from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { currencyFormatter, formatDate, STATUS_COLORS } from "@/lib/utils";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();
  const [projects, invoices, user] = await Promise.all([
    getProjects(),
    getInvoices(),
    getCurrentUserProfile(),
  ]);
  const canEditClients = user ? canAccess(user.role, "clients", "update") : false;
  const scopedProjects = projects.filter((project) => project.clientId === client.id);
  const scopedInvoices = invoices.filter((invoice) => invoice.clientId === client.id);
  const scopedFiles = client.files ?? [];
  const formDefaults = {
    id: client.id,
    name: client.name,
    company: client.company,
    website: client.website,
    primaryContact: client.primaryContact,
    email: client.email,
    phone: client.phone,
    country: client.country,
    timezone: client.timezone,
    industry: client.industry,
    relationshipStatus: client.relationshipStatus,
    notes: client.notes,
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            Client intelligence / {client.industry ?? "Industry"}
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">{client.name}</h1>
          <p className="text-sm text-zinc-500">{client.primaryContact}</p>
        </div>
        <Link
          href={`/projects?client=${client.id}`}
          className="text-sm font-semibold text-emerald-600 hover:underline"
        >
          View client projects →
        </Link>
      </div>
      {canEditClients && <ClientProfileEditor defaultValues={formDefaults} />}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Relationship</p>
          <p className="text-lg font-semibold text-zinc-900">{client.relationshipStatus}</p>
          <p className="text-xs text-zinc-500">Industry: {client.industry ?? "TBD"}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Projects in delivery</p>
          <p className="text-lg font-semibold">{scopedProjects.length}</p>
          <p className="text-xs text-zinc-500">
            Active: {scopedProjects.filter((p) => p.status === "In Progress").length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Lifetime paid invoices</p>
          <p className="text-lg font-semibold">
            {currencyFormatter(
              scopedInvoices
                .filter((invoice) => invoice.status === "Paid")
                .reduce((sum, invoice) => sum + invoice.total, 0),
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Contact</p>
          <div className="mt-2 space-y-1 text-sm text-zinc-600">
            <p>Email: <span className="font-medium">{client.email}</span></p>
            <p>Phone: <span className="font-medium">{client.phone ?? "—"}</span></p>
            <p>Website: <span className="font-medium">{client.website ?? "—"}</span></p>
            <p>Country: <span className="font-medium">{client.country ?? "—"}</span></p>
            <p>Timezone: <span className="font-medium">{client.timezone ?? "—"}</span></p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Active projects</h2>
              <Link
                href="/projects"
                className="text-sm font-semibold text-emerald-600 hover:underline"
              >
                Manage projects
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {scopedProjects.length === 0 && (
                <p className="text-sm text-zinc-500">No projects yet.</p>
              )}
              {scopedProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-semibold text-zinc-900 hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-zinc-500">{project.ownerName ?? "Unassigned"}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[project.status] ?? "bg-zinc-100 text-zinc-500"}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    Target end {formatDate(project.targetEndDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Invoices</h2>
              <Link
                href="/finances/invoices"
                className="text-sm font-semibold text-emerald-600"
              >
                Create invoice
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {scopedInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{invoice.id}</p>
                    <p className="text-xs text-zinc-500">
                      Due {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {currencyFormatter(invoice.total)}
                    </p>
                    <p className="text-xs text-zinc-500">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <AISummary
            entityType="client"
            payload={{
              client,
              projects: scopedProjects,
              invoices: scopedInvoices,
              files: scopedFiles,
            }}
          />
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Documents</h2>
            <div className="mt-3 space-y-2 text-sm">
              {scopedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between">
                  <p>{file.fileName}</p>
                  <p className="text-xs text-zinc-500">{formatDate(file.uploadedAt)}</p>
                </div>
              ))}
              {scopedFiles.length === 0 && (
                <p className="text-sm text-zinc-500">No files uploaded.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Notes
            </p>
            <p className="mt-2">{client.notes ?? "No notes captured yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
