import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  RevenueExpensesChart,
  SimpleBarChart,
} from "@/components/dashboard/insight-charts";
import {
  getClients,
  getDashboard,
  getProjects,
  getTasks,
} from "@/lib/data-service";
import { currencyFormatter, formatDate, STATUS_COLORS } from "@/lib/utils";

export default async function DashboardPage() {
  const [metrics, projects, tasks, clients] = await Promise.all([
    getDashboard(),
    getProjects(),
    getTasks(),
    getClients(),
  ]);
  const activeTasks = tasks.filter((task) => task.status !== "Done").slice(0, 5);
  const recentlyWonClients = clients.slice(0, 5);
  const projectStatusItems = metrics.projectsByStatus ?? [];
  const ensureAreaData = (rows?: { month: string; revenue: number; expenses: number }[]) =>
    rows && rows.length > 0
      ? rows
      : Array.from({ length: 4 }, (_, index) => ({
          month: `M${index + 1}`,
          revenue: 0,
          expenses: 0,
        }));
  const ensureBarData = (rows?: { month: string; value: number }[]) =>
    rows && rows.length > 0
      ? rows
      : Array.from({ length: 4 }, (_, index) => ({
          month: `W${index + 1}`,
          value: 0,
        }));
  const revenueTrend = ensureAreaData(metrics.revenueTrend);
  const newClientsTrend = ensureBarData(metrics.newClientsTrend);
  const completedProjectsTrend = ensureBarData(metrics.completedProjectsTrend);
  const topClients = metrics.topClients ?? [];
  const employeeWorkload = metrics.employeeWorkload ?? [];
  const projectStatusSummary = projectStatusItems.length
    ? projectStatusItems.map((item) => `${item.status}: ${item.value}`).join(" • ")
    : "No active data";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Clients"
          value={metrics.totalClients}
          trend={`${metrics.activeClients} active`}
        />
        <MetricCard
          label="Projects in Flight"
          value={metrics.totalProjects}
          trend={projectStatusSummary}
        />
        <MetricCard
          label="Outstanding Invoices"
          value={metrics.outstandingInvoices}
          currency
        />
        <MetricCard
          label="YTD Profit"
          value={metrics.profit}
          currency
          trend={`Paid invoices ${currencyFormatter(metrics.paidInvoices)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Finance pulse</p>
              <h2 className="text-lg font-semibold text-zinc-900">
                Revenue vs. Expenses
              </h2>
            </div>
            <Link
              href="/finances/invoices"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              View finance
            </Link>
          </div>
          <div className="mt-4">
            <RevenueExpensesChart data={revenueTrend} />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-zinc-500">Top clients by revenue</p>
            <h2 className="text-lg font-semibold text-zinc-900">Key accounts</h2>
          </div>
          <div className="space-y-3">
            {topClients.map((client) => (
              <div
                key={client.client}
                className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-zinc-800">{client.client}</p>
                  <p className="text-xs text-zinc-500">Top-line</p>
                </div>
                <p className="text-sm font-semibold">
                  {currencyFormatter(client.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Pipeline health</p>
              <h2 className="text-lg font-semibold text-zinc-900">New clients</h2>
            </div>
            <Link
              href="/leads"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              Go to leads
            </Link>
          </div>
          <SimpleBarChart data={newClientsTrend} color="#10b981" label="New" />
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Delivery</p>
              <h2 className="text-lg font-semibold text-zinc-900">Projects</h2>
            </div>
            <Link
              href="/projects"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              Go to projects
            </Link>
          </div>
          <SimpleBarChart
            data={completedProjectsTrend}
            color="#0ea5e9"
            label="Completed"
          />
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Team</p>
              <h2 className="text-lg font-semibold text-zinc-900">
                Workload snapshot
              </h2>
            </div>
            <Link
              href="/tasks"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              My tasks
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {employeeWorkload.map((row) => (
              <div
                key={row.employee}
                className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{row.employee}</p>
                  <p className="text-xs text-zinc-500">
                    {row.projects} projects
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {row.openTasks} open tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Projects timeline
            </h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              All projects
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{project.name}</p>
                    <p className="text-xs text-zinc-500">
                      Owner: {project.ownerName ?? "Assigned"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[project.status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Target end: {formatDate(project.targetEndDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Active tasks</h2>
            <Link
              href="/tasks"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              View board
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{task.title}</p>
                    <p className="text-xs text-zinc-500">
                      {task.projectName} • {task.assigneeName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[task.status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Due {formatDate(task.dueDate)} • {task.loggedHours ?? 0}h logged
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Relationship watchlist
          </h2>
          <Link
            href="/clients"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Go to clients
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {recentlyWonClients.map((client) => (
            <div
              key={client.id}
              className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{client.name}</p>
                  <p className="text-xs text-zinc-500">{client.industry}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[client.relationshipStatus] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {client.relationshipStatus}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{client.notes ?? "No notes yet."}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
