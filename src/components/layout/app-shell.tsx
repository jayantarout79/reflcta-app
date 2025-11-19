import type { Role, UserProfile } from "@/lib/types";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  user,
  children,
}: {
  user?: UserProfile | null;
  children: React.ReactNode;
}) {
  const role = (user?.role ?? "viewer") as Role;
  return (
    <div className="flex min-h-screen bg-[var(--color-page)]">
      <Sidebar role={role} />
      <div className="flex w-full flex-col">
        <Topbar user={user} role={role} />
        <main className="flex-1 bg-gradient-to-br from-white/80 via-white/40 to-transparent p-4 sm:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
