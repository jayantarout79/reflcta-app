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
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar role={role} />
      <div className="flex w-full flex-col">
        <Topbar user={user} />
        <main className="flex-1 space-y-8 bg-zinc-50 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
