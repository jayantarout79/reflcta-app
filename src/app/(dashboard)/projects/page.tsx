import Link from "next/link";
import { ProjectForm } from "@/components/forms/project-form";
import { DeleteConfirmButton } from "@/components/delete-confirm";
import {
  getClients,
  getEmployees,
  getProjects,
  getCurrentUserProfile,
} from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { currencyFormatter, formatDate, STATUS_COLORS } from "@/lib/utils";

export default async function ProjectsPage() {
  const [projects, clients, employees, user] = await Promise.all([
    getProjects(),
    getClients(),
    getEmployees(),
    getCurrentUserProfile(),
  ]);
  const canCreateProject = user ? canAccess(user.role, "projects", "create") : false;
  const canEditProject = user ? canAccess(user.role, "projects", "update") : false;
  const canDeleteProject = user ? canAccess(user.role, "projects", "delete") : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Delivery tracker</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Projects</h1>
        </div>
        <p className="text-sm text-zinc-500">
          {projects.filter((p) => p.status === "In Progress").length} active engagements
        </p>
      </div>
      {canCreateProject && (
        <ProjectForm clients={clients} employees={employees} />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">{project.category}</p>
                <h2 className="text-lg font-semibold text-zinc-900">{project.name}</h2>
                <p className="text-sm text-zinc-500">{project.ownerName ?? "Owner TBD"}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[project.status] ?? "bg-zinc-100 text-zinc-600"}`}
              >
                {project.status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-500">Client</p>
                <p className="font-semibold">{project.clientName ?? "TBD"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Budget</p>
                <p className="font-semibold">
                  {project.budget ? currencyFormatter(project.budget) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Target</p>
                <p className="font-semibold">{formatDate(project.targetEndDate)}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
              {project.description ?? "No description provided."}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
              <Link
                href={`/projects/${project.id}`}
                className="text-sm font-semibold text-emerald-600 hover:underline"
              >
                View details
              </Link>
              {canEditProject && (
                <details className="w-full">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-600">
                    Edit project
                  </summary>
                  <div className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                    <ProjectForm
                      clients={clients}
                      employees={employees}
                      defaultValues={{
                        id: project.id,
                        name: project.name,
                        clientId: project.clientId,
                        ownerId: project.ownerId,
                        category: project.category,
                        description: project.description,
                        status: project.status,
                        priority: project.priority,
                        startDate: project.startDate,
                        targetEndDate: project.targetEndDate,
                        budget: project.budget,
                      }}
                    />
                  </div>
                </details>
              )}
              {canDeleteProject && (
                <div className="mt-3 text-right">
                  <DeleteConfirmButton
                    entityLabel={project.name}
                    request={{ entity: "project", payload: { id: project.id } }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
