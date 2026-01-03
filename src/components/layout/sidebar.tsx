"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  GraduationCap,
  Truck,
} from "lucide-react";
import { canAccess, type Resource } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export const NAV_SECTIONS: {
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
      { label: "Products", href: "/products", icon: FolderKanban, resource: "products" },
      { label: "Drop Shipping", href: "/drop-shipping", icon: Truck, resource: "orders" },
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
  {
    label: "Yuktra Courses",
    items: [
      {
        label: "Enrollments",
        href: "/courses",
        icon: GraduationCap,
        resource: "courses",
      },
    ],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-72 flex-none border-r border-white/30 bg-white/80 p-6 shadow-[inset_-1px_0_0_rgba(255,255,255,0.6)] backdrop-blur lg:block">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 px-4 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow">
          <Image
            src="/logo_yuktra.png"
            alt="YuktraAI logo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            YuktraAI CRM
          </p>
          <p className="text-xs text-[var(--color-muted)]">Intelligence studio</p>
        </div>
      </div>
      <nav className="mt-8 space-y-7">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              {section.label}
            </p>
            <div className="mt-3 space-y-1.5">
              {section.items
                .filter((item) => canAccess(role, item.resource))
                .map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-[var(--color-primary)]/90 text-white shadow-[0_15px_30px_rgba(37,99,235,0.25)]"
                          : "text-[var(--color-muted)] hover:bg-white/90 hover:text-[var(--color-foreground)]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-2xl border text-[var(--color-muted)] transition",
                          isActive
                            ? "border-white/30 bg-white/20 text-white"
                            : "border-transparent bg-[var(--color-surface-muted)] group-hover:border-white/60",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
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
