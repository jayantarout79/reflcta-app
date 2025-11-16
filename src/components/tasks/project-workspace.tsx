"use client";

import { useMemo, useState } from "react";
import type { Employee, Project, Task, TimeEntry } from "@/lib/types";
import { TeamBoard } from "@/components/tasks/team-board";
import { UpdateTimeEntryDrawer } from "@/components/time-entries/update-drawer";

type ProjectWorkspaceProps = {
  projects: Project[];
  tasks: Task[];
  employees: Employee[];
  activeEmployees: Employee[];
  timeEntries: TimeEntry[];
  canManageTasks: boolean;
  canDeleteTasks: boolean;
  canLogTime: boolean;
};

export function ProjectWorkspace({
  projects,
  tasks,
  employees,
  activeEmployees,
  timeEntries,
  canManageTasks,
  canDeleteTasks,
  canLogTime,
}: ProjectWorkspaceProps) {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const filteredEntries = useMemo(() => {
    if (selectedProject === "all") return timeEntries;
    return timeEntries.filter((entry) => entry.projectId === selectedProject);
  }, [selectedProject, timeEntries]);

  return (
    <div className="space-y-6">
      <TeamBoard
        projects={projects}
        tasks={tasks}
        employees={employees}
        activeEmployees={activeEmployees}
        canManageTasks={canManageTasks}
        canDeleteTasks={canDeleteTasks}
        canLogTime={canLogTime}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
      />
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Recent time entries</h2>
            <p className="text-xs text-zinc-500">
              Time entries are scoped to the selected project filter for accurate audit trails.
            </p>
          </div>
          {selectedProject !== "all" && (
            <p className="text-xs font-semibold text-zinc-500">
              Showing project:{" "}
              <span className="text-zinc-900">
                {projects.find((project) => project.id === selectedProject)?.name ?? "—"}
              </span>
            </p>
          )}
        </div>
        <UpdateTimeEntryDrawer entries={filteredEntries.slice(0, 10)} employees={activeEmployees} />
      </div>
    </div>
  );
}
