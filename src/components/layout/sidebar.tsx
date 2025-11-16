"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  Gauge,
  Users,
  Briefcase,
  FolderKanban,
  FileStack,
  Receipt,
  PiggyBank,
  UserCircle,
  Bot,
} from "lucide-react";
import { canAccess, type Resource } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const navSections: {
  label: string;
  items: { label: string; href: string; icon: LucideIcon; resource: Resource }[];
}[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Gauge, resource: "analytics" },
      { label: "Clients", href: "/clients", icon: Users, resource: "clients" },
      { label: "Leads", href: "/leads", icon: FolderKanban, resource: "leads" },
      { label: "Projects", href: "/projects", icon: Briefcase, resource: "projects" },
      { label: "Tasks", href: "/tasks", icon: FileStack, resource: "tasks" },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Invoices",
        href: "/finances/invoices",
        icon: Receipt,
        resource: "invoices",
      },
      {
        label: "Expenses",
        href: "/finances/expenses",
        icon: PiggyBank,
        resource: "expenses",
      },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Files", href: "/files", icon: FolderKanban, resource: "files" },
      {
        label: "Employees",
        href: "/hr/employees",
        icon: UserCircle,
        resource: "employees",
      },
      { label: "AI Studio", href: "/ai/proposals", icon: Bot, resource: "ai" },
    ],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 flex-none border-r border-zinc-200 bg-white/80 p-4 lg:block">
      <div className="flex items-center gap-2 px-2 py-6">
        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold">
          YA
        </div>
        <div>
          <p className="font-semibold text-zinc-900">YuktraAI CRM</p>
          <p className="text-xs text-zinc-500">Internal ops</p>
        </div>
      </div>
      <nav className="space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {section.label}
            </p>
            <div className="mt-2 space-y-1">
              {section.items
                .filter((item) => canAccess(role, item.resource))
                .map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-zinc-600 hover:bg-zinc-100",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
