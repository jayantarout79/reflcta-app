import { ExpenseForm } from "@/components/forms/expense-form";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import {
  getClients,
  getExpenses,
  getProjects,
  getCurrentUserProfile,
} from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { currencyFormatter, formatDate } from "@/lib/utils";

export default async function ExpensesPage() {
  const [expenses, clients, projects, user] = await Promise.all([
    getExpenses(),
    getClients(),
    getProjects(),
    getCurrentUserProfile(),
  ]);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const canCreate = user ? canAccess(user.role, "expenses", "create") : false;
  const canUpdate = user ? canAccess(user.role, "expenses", "update") : false;
  const canDelete = user ? canAccess(user.role, "expenses", "delete") : false;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Cost control
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">Expenses</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{currencyFormatter(total)} spent</p>
      </div>
      {canCreate && (
        <ExpenseForm clients={clients} projects={projects} />
      )}
      <div className="card p-6">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">Expense log</h2>
        <div className="mt-4 space-y-4">
          {expenses.map((expense) => (
            <article
              key={expense.id}
              className="space-y-4 rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/70 p-4"
            >
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {expense.category}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">{expense.vendor ?? "Vendor"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Client / Project
                  </p>
                  <p className="text-sm text-[var(--color-foreground)]">
                    {expense.clientName ?? "—"} / {expense.projectName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    Date
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {formatDate(expense.date)}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between gap-2 text-right">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      {currencyFormatter(expense.amount)}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {expense.currency ?? "INR"}
                    </p>
                  </div>
                  {canDelete && (
                    <DeleteConfirmButton
                      entityLabel={expense.category}
                      request={{ entity: "expense", payload: { id: expense.id } }}
                    />
                  )}
                </div>
              </div>
              {canUpdate && (
                <details className="border-t border-white/60 pt-3">
                  <summary className="flex cursor-pointer justify-end text-sm font-semibold text-[var(--color-primary)]">
                    Edit expense
                  </summary>
                  <div className="mt-3">
                    <ExpenseForm
                      clients={clients}
                      projects={projects}
                      defaultValues={{
                        id: expense.id,
                        date: expense.date ? expense.date.slice(0, 10) : undefined,
                        amount: expense.amount,
                        currency: expense.currency,
                        category: expense.category,
                        projectId: expense.projectId,
                        clientId: expense.clientId,
                        vendor: expense.vendor,
                        notes: expense.notes,
                      }}
                    />
                  </div>
                </details>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
