import { TaskForm } from "@/components/forms/task-form";
import { ProjectWorkspace } from "@/components/tasks/project-workspace";
import {
  getEmployees,
  getProjects,
  getTasks,
  getTimeEntries,
  getCurrentUserProfile,
} from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { formatDate, STATUS_COLORS } from "@/lib/utils";

export default async function TasksPage() {
  const [tasks, timeEntries, projects, employees, user] = await Promise.all([
    getTasks(),
    getTimeEntries(),
    getProjects(),
    getEmployees(),
    getCurrentUserProfile(),
  ]);

  const myTasks = tasks.filter((task) => task.assigneeId === user?.id);
  const canManageTasks = user ? canAccess(user.role, "tasks", "create") : false;
  const canDeleteTasks = user ? canAccess(user.role, "tasks", "delete") : false;
  const canLogTime = user ? canAccess(user.role, "time", "create") : false;
  const activeEmployees = employees.filter((employee) => employee.status === "Active");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Delivery board</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Tasks</h1>
        </div>
        <p className="text-sm text-zinc-500">{myTasks.length} assigned to you</p>
      </div>
      {canManageTasks && <TaskForm projects={projects} employees={employees} />}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">My focus</h2>
        <div className="mt-4 space-y-3">
          {myTasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">{task.title}</p>
                  <p className="text-xs text-zinc-500">
                    {task.projectName} • Due {formatDate(task.dueDate)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[task.status] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {task.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Logged {task.loggedHours ?? 0}h / {task.estimatedHours ?? "n/a"}h
              </p>
            </div>
          ))}
          {myTasks.length === 0 && (
            <p className="text-sm text-zinc-500">No assignments yet.</p>
          )}
        </div>
      </div>
      <ProjectWorkspace
        projects={projects}
        tasks={tasks}
        employees={employees}
        activeEmployees={activeEmployees}
        timeEntries={timeEntries}
        canManageTasks={canManageTasks}
        canDeleteTasks={canDeleteTasks}
        canLogTime={canLogTime}
      />
    </div>
  );
}
