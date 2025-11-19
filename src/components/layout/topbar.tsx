import { signOutAction } from "@/actions/auth";
import type { Role, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export function Topbar({ user, role }: { user?: UserProfile | null; role: Role }) {
  const displayName = user?.name?.trim() || "YuktraAI User";
  const initials =
    displayName
      .split(" ")
      .map((part) => part?.[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "YA";
  return (
    <header className="flex flex-col gap-4 border-b border-white/60 bg-white/70 px-4 py-4 backdrop-blur-lg lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Workspace
          </p>
          <p className="text-xl font-semibold text-[var(--color-foreground)]">{displayName}</p>
        </div>
        <MobileNav role={role} />
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold capitalize text-[var(--color-foreground)]">
            {user?.role ?? "viewer"}
          </p>
          <p className="text-xs text-[var(--color-muted)]">{user?.email ?? "—"}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold">
          {initials}
        </div>
        {user ? (
          <form action={signOutAction}>
            <Button variant="secondary" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        ) : (
          <span className="text-xs text-[var(--color-muted)]">No active session</span>
        )}
      </div>
    </header>
  );
}
