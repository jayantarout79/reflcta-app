import { notFound } from "next/navigation";
import Link from "next/link";
import { TaskForm, TimeEntryForm } from "@/components/forms/task-form";
import { AISummary } from "@/components/ai/ai-summary";
import {
  getClientById,
  getEmployees,
  getProjectById,
  getTasks,
  getTimeEntries,
  getCurrentUserProfile,
} from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { currencyFormatter, formatDate, STATUS_COLORS } from "@/lib/utils";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  const [tasks, timeEntries, employees, client, user] = await Promise.all([
    getTasks(),
    getTimeEntries(),
    getEmployees(),
    getClientById(project.clientId),
    getCurrentUserProfile(),
  ]);
  const scopedTasks = tasks.filter((task) => task.projectId === project.id);
  const scopedEntries = timeEntries.filter((entry) =>
    scopedTasks.some((task) => task.id === entry.taskId),
  );
  const totalHours = scopedEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const canManageTasks = user ? canAccess(user.role, "tasks", "create") : false;
  const canLogTime = user ? canAccess(user.role, "time", "create") : false;
  const activeEmployees = employees.filter((employee) => employee.status === "Active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            {client?.name ?? "Client"} / {project.category}
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">{project.name}</h1>
          <p className="text-sm text-zinc-500">{project.description}</p>
        </div>
        <Link
          href="/projects"
          className="text-sm font-semibold text-emerald-600 hover:underline"
        >
          Back to list
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Status</p>
          <p className="text-lg font-semibold">{project.status}</p>
          <p className="text-xs text-zinc-500">Priority {project.priority}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Owner</p>
          <p className="text-lg font-semibold">{project.ownerName ?? "Unassigned"}</p>
          <p className="text-xs text-zinc-500">
            Target: {formatDate(project.targetEndDate)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Budget</p>
          <p className="text-lg font-semibold">
            {project.budget ? currencyFormatter(project.budget) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Logged hours</p>
          <p className="text-lg font-semibold">{totalHours} h</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Tasks</h2>
              <p className="text-xs text-zinc-500">{scopedTasks.length} items</p>
            </div>
            <div className="mt-4 space-y-3">
              {scopedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">{task.title}</p>
                      <p className="text-xs text-zinc-500">
                        {task.assigneeName} • Due {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[task.status] ?? "bg-zinc-100 text-zinc-600"}`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {task.loggedHours ?? 0}h / {task.estimatedHours ?? "n/a"}h
                  </p>
                  {canLogTime && (
                    <div className="mt-2">
                      <TimeEntryForm
                        taskId={task.id}
                        employees={activeEmployees}
                        defaultEmployeeId={
                          activeEmployees.find(
                            (employee) =>
                              employee.profileId === task.assigneeId ||
                              employee.id === task.assigneeId,
                          )?.profileId
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
              {scopedTasks.length === 0 && (
                <p className="text-sm text-zinc-500">No tasks added.</p>
              )}
            </div>
          </div>
          {canManageTasks && (
            <TaskForm
              projects={[project]}
              employees={activeEmployees}
            />
          )}
        </div>
        <div className="space-y-4">
          <AISummary
            entityType="project"
            payload={{ project, tasks: scopedTasks, timeEntries: scopedEntries }}
          />
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Recent activity</h2>
            <div className="mt-3 space-y-2 text-sm">
              {(project.activities ?? []).map((activity) => (
                <div key={activity.id} className="rounded-xl bg-zinc-50 px-3 py-2">
                  <p className="text-zinc-700">{activity.message}</p>
                  <p className="text-xs text-zinc-500">{formatDate(activity.createdAt)}</p>
                </div>
              ))}
              {(!project.activities || project.activities.length === 0) && (
                <p className="text-sm text-zinc-500">No updates logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
