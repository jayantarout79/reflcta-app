import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUserProfile } from "@/lib/data-service";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUserProfile();
  if (user) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-emerald-100/50">
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <Image
                src="/logo_yuktra.png"
                alt="YuktraAI logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">
                YuktraAI
              </p>
              <h1 className="text-2xl font-semibold text-zinc-900">
                Sign in to Command Center
              </h1>
            </div>
          </div>
          <p className="text-sm text-zinc-500">
            Access clients, projects, finance, and AI automation tools.
          </p>
        </div>
        <LoginForm />
        <p className="mt-4 text-xs text-zinc-500">
          Supabase Auth enforced. In demo mode, use any email/password.
        </p>
      </div>
    </div>
  );
}
