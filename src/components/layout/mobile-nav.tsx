"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAccess } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import { NAV_SECTIONS } from "./sidebar";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="lg:hidden"
        aria-label="Toggle navigation"
        onClick={toggle}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} role="presentation" />
          <div className="relative ml-auto flex h-full w-72 max-w-[90%] flex-col bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">Navigation</p>
              <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="space-y-6 overflow-y-auto pb-10">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    {section.label}
                  </p>
                  <div className="mt-2 space-y-2">
                    {section.items
                      .filter((item) => canAccess(role, item.resource))
                      .map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "bg-[var(--color-primary)] text-white"
                                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
                            }`}
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
          </div>
        </div>
      )}
    </>
  );
}
