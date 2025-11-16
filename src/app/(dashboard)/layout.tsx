import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data-service";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserProfile();
  if (!user) {
    redirect("/login");
  }
  return <AppShell user={user}>{children}</AppShell>;
}
