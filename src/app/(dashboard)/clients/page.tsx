import Link from "next/link";
import { ClientForm } from "@/components/forms/client-form";
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Client & relationship hub
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">Clients</h1>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
        >
          View leads pipeline
          <span aria-hidden className="text-lg">→</span>
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
              className="card block p-5"
              data-hover="true"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    {client.industry ?? "Industry TBD"}
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">{client.name}</h2>
                  <p className="text-sm text-[var(--color-muted)]">{client.primaryContact}</p>
                </div>
                <span
                  className={`chip px-3 py-1 ${STATUS_COLORS[client.relationshipStatus] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {client.relationshipStatus}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Projects
                  </p>
                  <p className="text-lg font-semibold text-[var(--color-foreground)]">
                    {clientProjects.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Paid revenue
                  </p>
                  <p className="text-lg font-semibold text-[var(--color-foreground)]">
                    {currencyFormatter(totalRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Last touch
                  </p>
                  <p className="text-lg font-semibold text-[var(--color-foreground)]">
                    {formatDate(lastTouch)}
                  </p>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-[var(--color-muted)]">
                {client.notes ?? "No notes captured yet."}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
