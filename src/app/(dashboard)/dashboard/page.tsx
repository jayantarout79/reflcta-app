import Link from "next/link";
import { ArrowUpRight, Briefcase, LineChart, Receipt, Users } from "lucide-react";
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
  const totalProjectCount = projectStatusItems.reduce((sum, item) => sum + item.value, 0) || metrics.totalProjects;
  const completedCount = projectStatusItems.find((item) => item.status === "Completed")?.value ?? 0;
  const projectStatusSummary = projectStatusItems.length
    ? projectStatusItems.map((item) => `${item.status}: ${item.value}`).join(" • ")
    : "No active data";
  const paymentProgressBase = metrics.outstandingInvoices + metrics.paidInvoices;
  const paymentProgress = paymentProgressBase
    ? metrics.paidInvoices / paymentProgressBase
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Clients"
          value={metrics.totalClients}
          trend={`${metrics.activeClients} active`}
          icon={Users}
        />
        <MetricCard
          label="Projects in Flight"
          value={metrics.totalProjects}
          trend={projectStatusSummary}
          icon={Briefcase}
          progress={{
            label: "Completed",
            value: totalProjectCount ? completedCount / totalProjectCount : 0,
            tone: "success",
          }}
        />
        <MetricCard
          label="Outstanding Invoices"
          value={metrics.outstandingInvoices}
          currency
          icon={Receipt}
          progress={{
            label: "Paid",
            value: paymentProgress,
            tone: paymentProgress > 0.7 ? "success" : "warning",
          }}
        />
        <MetricCard
          label="YTD Profit"
          value={metrics.profit}
          currency
          trend={`Paid invoices ${currencyFormatter(metrics.paidInvoices)}`}
          icon={LineChart}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2" data-hover="true">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                Finance pulse
              </p>
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Revenue vs. Expenses
              </h2>
            </div>
            <Link
              href="/finances/invoices"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
            >
              View finance
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6">
            <RevenueExpensesChart data={revenueTrend} />
          </div>
        </div>

        <div className="card space-y-4 p-6" data-hover="true">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
              Top clients by revenue
            </p>
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              Key accounts
            </h2>
          </div>
          <div className="space-y-3">
            {topClients.map((client) => (
              <div
                key={client.client}
                className="flex items-center justify-between rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/60 px-3 py-3 shadow-sm transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-semibold text-[var(--color-foreground)]">{client.client}</p>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Top-line</p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {currencyFormatter(client.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-6" data-hover="true">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                Pipeline health
              </p>
              <h2 className="text-xl font-semibold text-[var(--color-foreground)]">New clients</h2>
            </div>
            <Link
              href="/leads"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
            >
              Leads
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <SimpleBarChart data={newClientsTrend} color="#2563eb" label="New" />
        </div>
        <div className="card p-6" data-hover="true">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                Delivery
              </p>
              <h2 className="text-xl font-semibold text-[var(--color-foreground)]">Projects</h2>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
            >
              Projects
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <SimpleBarChart
            data={completedProjectsTrend}
            color="#7c3aed"
            label="Completed"
          />
        </div>
        <div className="card p-6" data-hover="true">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                Team
              </p>
              <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                Workload snapshot
              </h2>
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
            >
              Tasks
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {employeeWorkload.map((row) => (
              <div
                key={row.employee}
                className="flex items-center justify-between rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/60 px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-[var(--color-foreground)]">{row.employee}</p>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    {row.projects} projects
                  </p>
                </div>
                <span className="chip bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {row.openTasks} open tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6" data-hover="true">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
              Projects timeline
            </h2>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
            >
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-white/50 bg-[var(--color-surface-muted)]/80 px-4 py-3 shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">{project.name}</p>
                    <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                      Owner: {project.ownerName ?? "Assigned"}
                    </p>
                  </div>
                  <span
                    className={`chip px-3 py-1 ${STATUS_COLORS[project.status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Target end: {formatDate(project.targetEndDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6" data-hover="true">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">Active tasks</h2>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
            >
              Board
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-white/50 bg-[var(--color-surface-muted)]/80 px-4 py-3 shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">{task.title}</p>
                    <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                      {task.projectName} • {task.assigneeName}
                    </p>
                  </div>
                  <span
                    className={`chip px-3 py-1 ${STATUS_COLORS[task.status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Due {formatDate(task.dueDate)} • {task.loggedHours ?? 0}h logged
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6" data-hover="true">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Relationship watchlist
          </h2>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
          >
            Clients
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {recentlyWonClients.map((client) => (
            <div
              key={client.id}
              className="rounded-2xl border border-white/50 bg-[var(--color-surface-muted)]/80 p-4 shadow-sm transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--color-foreground)]">{client.name}</p>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    {client.industry}
                  </p>
                </div>
                <span
                  className={`chip px-3 py-1 ${STATUS_COLORS[client.relationshipStatus] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {client.relationshipStatus}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {client.notes ?? "No notes yet."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
