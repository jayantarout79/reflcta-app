import { InvoiceWorkspace } from "@/components/invoices/invoice-workspace";
import {
  getClients,
  getInvoices,
  getProjects,
  getCurrentUserProfile,
} from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { currencyFormatter } from "@/lib/utils";

export default async function InvoicesPage() {
  const [invoices, clients, projects, user] = await Promise.all([
    getInvoices(),
    getClients(),
    getProjects(),
    getCurrentUserProfile(),
  ]);
  const outstanding = invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const paid = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const canManageInvoices =
    user && (canAccess(user.role, "invoices", "create") || canAccess(user.role, "invoices", "update"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Revenue intelligence</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Invoices</h1>
        </div>
        <p className="text-sm text-zinc-500">{invoices.length} total records</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Outstanding</p>
          <p className="text-2xl font-semibold">{currencyFormatter(outstanding)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Paid YTD</p>
          <p className="text-2xl font-semibold">{currencyFormatter(paid)}</p>
        </div>
      </div>
      <InvoiceWorkspace
        invoices={invoices}
        clients={clients}
        projects={projects}
        canManage={Boolean(canManageInvoices)}
      />
    </div>
  );
}
