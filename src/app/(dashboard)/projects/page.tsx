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
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Delivery tracker
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">Projects</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
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
            className="card p-5"
            data-hover="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                  {project.category}
                </p>
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{project.name}</h2>
                <p className="text-sm text-[var(--color-muted)]">{project.ownerName ?? "Owner TBD"}</p>
              </div>
              <span
                className={`chip px-3 py-1 ${STATUS_COLORS[project.status] ?? "bg-zinc-100 text-zinc-600"}`}
              >
                {project.status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Client</p>
                <p className="font-semibold text-[var(--color-foreground)]">{project.clientName ?? "TBD"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Budget</p>
                <p className="font-semibold text-[var(--color-foreground)]">
                  {project.budget ? currencyFormatter(project.budget) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Target</p>
                <p className="font-semibold text-[var(--color-foreground)]">{formatDate(project.targetEndDate)}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-[var(--color-muted)]">
              {project.description ?? "No description provided."}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]"
              >
                View details ↗
              </Link>
              {canEditProject && (
                <details className="w-full">
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--color-muted)]">
                    Edit project
                  </summary>
                  <div className="mt-3 rounded-2xl border border-white/60 bg-[var(--color-surface-muted)]/80 p-3">
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
