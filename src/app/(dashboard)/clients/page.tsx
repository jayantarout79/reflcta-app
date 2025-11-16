import Link from "next/link";
import { ClientForm } from "@/components/forms/client-form";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import {
  getClients,
  getInvoices,
  getProjects,
  getCurrentUserProfile,
} from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { currencyFormatter, formatDate, STATUS_COLORS } from "@/lib/utils";

export default async function ClientsPage() {
  const [clients, projects, invoices, user] = await Promise.all([
    getClients(),
    getProjects(),
    getInvoices(),
    getCurrentUserProfile(),
  ]);
  const canEditClients = user ? canAccess(user.role, "clients", "create") : false;
  const canDeleteClients = user ? canAccess(user.role, "clients", "delete") : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-zinc-500">Client & relationship hub</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
        </div>
        <Link
          href="/leads"
          className="text-sm font-semibold text-emerald-600 hover:underline"
        >
          View leads pipeline →
        </Link>
      </div>
      {canEditClients && <ClientForm />}
      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => {
          const clientProjects = projects.filter((project) => project.clientId === client.id);
          const clientInvoices = invoices.filter((invoice) => invoice.clientId === client.id);
          const totalRevenue = clientInvoices
            .filter((inv) => inv.status === "Paid")
            .reduce((sum, inv) => sum + inv.total, 0);
          const lastTouch =
            clientProjects[0]?.targetEndDate ??
            clientProjects[0]?.startDate ??
            clientInvoices[0]?.issueDate;
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    {client.industry ?? "Industry TBD"}
                  </p>
                  <h2 className="text-lg font-semibold text-zinc-900">{client.name}</h2>
                  <p className="text-sm text-zinc-500">{client.primaryContact}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[client.relationshipStatus] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {client.relationshipStatus}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-zinc-500">Projects</p>
                  <p className="text-lg font-semibold">{clientProjects.length}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Paid revenue</p>
                  <p className="text-lg font-semibold">
                    {currencyFormatter(totalRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Last touch</p>
                  <p className="text-lg font-semibold">{formatDate(lastTouch)}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
                {client.notes ?? "No notes captured yet."}
              </p>
              {canDeleteClients && (
                <div className="mt-3">
                  <DeleteConfirmButton
                    entityLabel={client.name}
                    request={{ entity: "client", payload: { id: client.id } }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
