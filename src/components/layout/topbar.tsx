import { signOutAction } from "@/actions/auth";
import type { UserProfile } from "@/lib/types";

export function Topbar({ user }: { user?: UserProfile | null }) {
  const displayName = user?.name?.trim() || "YuktraAI User";
  const initials =
    displayName
      .split(" ")
      .map((part) => part?.[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "YA";
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur">
      <div>
        <p className="text-sm text-zinc-500">Welcome back</p>
        <p className="text-lg font-semibold text-zinc-900">{displayName}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium capitalize text-zinc-700">
            {user?.role ?? "viewer"}
          </p>
          <p className="text-xs text-zinc-500">{user?.email ?? "—"}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
          {initials}
        </div>
        {user ? (
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Sign out
            </button>
          </form>
        ) : (
          <span className="text-xs text-zinc-400">No active session</span>
        )}
      </div>
    </header>
  );
}
