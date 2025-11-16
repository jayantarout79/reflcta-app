"use client";

import { useMemo } from "react";
import { TaskForm, TimeEntryForm } from "@/components/forms/task-form";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import type { Employee, Project, Task } from "@/lib/types";
import { formatDate, STATUS_COLORS } from "@/lib/utils";

type TeamBoardProps = {
  projects: Project[];
  tasks: Task[];
  employees: Employee[];
  activeEmployees: Employee[];
  canManageTasks: boolean;
  canDeleteTasks: boolean;
  canLogTime: boolean;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
};

export function TeamBoard({
  projects,
  tasks,
  employees,
  activeEmployees,
  canManageTasks,
  canDeleteTasks,
  canLogTime,
  selectedProject,
  onProjectChange,
}: TeamBoardProps) {
  const projectOptions = useMemo(() => projects.map((project) => ({ id: project.id, name: project.name })), [projects]);
  const visibleProjects =
    selectedProject === "all" ? projects : projects.filter((project) => project.id === selectedProject);

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Team board</h2>
          <p className="text-xs text-zinc-500">
            Filter by project to focus on a single delivery lane. Expand a task to update details or log time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="team-board-filter" className="text-xs font-semibold text-zinc-500">
            Project
          </label>
          <select
            id="team-board-filter"
            value={selectedProject}
            onChange={(event) => onProjectChange(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-1 text-sm"
          >
            <option value="all">All projects</option>
            {projectOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {visibleProjects.map((project) => {
          const projectTasks = tasks.filter((task) => task.projectId === project.id);
          if (projectTasks.length === 0) {
            return null;
          }
          return (
            <div key={project.id} className="rounded-2xl border border-zinc-100 p-4">
              <p className="text-sm font-semibold">{project.name}</p>
              <div className="mt-2 space-y-3 text-sm">
                {projectTasks.map((task) => {
                  const defaultLogEmployee = activeEmployees.find(
                    (employee) => employee.profileId === task.assigneeId || employee.id === task.assigneeId,
                  )?.profileId;
                  return (
                    <details key={task.id} className="rounded-2xl border border-zinc-100 bg-white/70 p-3">
                      <summary className="flex cursor-pointer items-center justify-between">
                        <div>
                          <p className="font-semibold">{task.title}</p>
                          <p className="text-xs text-zinc-500">
                            {task.assigneeName ?? "Unassigned"} • {formatDate(task.dueDate)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[task.status] ?? "bg-zinc-100 text-zinc-600"}`}
                        >
                          {task.status}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3">
                        {canManageTasks && (
                          <div className="rounded-2xl border border-zinc-100 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Update task</p>
                            <TaskForm
                              projects={projects}
                              employees={employees}
                              defaultValues={{
                                id: task.id,
                                title: task.title,
                                description: task.description,
                                projectId: task.projectId,
                                assigneeId: task.assigneeId,
                                status: task.status,
                                priority: task.priority,
                                startDate: task.startDate,
                                dueDate: task.dueDate,
                                estimatedHours: task.estimatedHours,
                              }}
                            />
                            {canDeleteTasks && (
                              <div className="mt-2 text-right">
                                <DeleteConfirmButton
                                  entityLabel={task.title}
                                  request={{
                                    entity: "task",
                                    payload: { id: task.id, projectId: task.projectId },
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {canLogTime && (
                          <div className="rounded-2xl border border-zinc-100 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Log time</p>
                            <TimeEntryForm
                              taskId={task.id}
                              employees={activeEmployees}
                              defaultEmployeeId={defaultLogEmployee}
                            />
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })}
        {visibleProjects.every(
          (project) => !tasks.some((task) => task.projectId === project.id),
        ) && (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
            No tasks match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
