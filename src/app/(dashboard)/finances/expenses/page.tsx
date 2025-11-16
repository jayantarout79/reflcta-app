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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Cost control</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Expenses</h1>
        </div>
        <p className="text-sm text-zinc-500">{currencyFormatter(total)} spent</p>
      </div>
      {user && canAccess(user.role, "expenses", "create") && (
        <ExpenseForm clients={clients} projects={projects} />
      )}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Expense log</h2>
        <div className="mt-4 space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="grid gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 sm:grid-cols-5"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">{expense.category}</p>
                <p className="text-xs text-zinc-500">{expense.vendor ?? "Vendor"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Client / Project</p>
                <p className="text-sm">
                  {expense.clientName ?? "—"} / {expense.projectName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Date</p>
                <p className="text-sm font-semibold">{formatDate(expense.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{currencyFormatter(expense.amount)}</p>
                <p className="text-xs text-zinc-500">{expense.currency}</p>
              </div>
              {user && canAccess(user.role, "expenses", "update") && (
                <details>
                  <summary className="cursor-pointer text-xs font-semibold text-zinc-500">
                    Edit
                  </summary>
                  <div className="mt-2 rounded-2xl border border-zinc-100 bg-white/80 p-3">
                    <ExpenseForm
                      clients={clients}
                      projects={projects}
                      defaultValues={{
                        id: expense.id,
                        date: expense.date,
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
              {user && canAccess(user.role, "expenses", "delete") && (
                <div className="text-right">
                  <DeleteConfirmButton
                    entityLabel={expense.category}
                    request={{ entity: "expense", payload: { id: expense.id } }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
