"use client";

import { useActionState } from "react";
import { signInAction, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = { message: null };

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-zinc-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="you@yuktra.ai"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="••••••••"
        />
      </div>
      {state?.message && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
      >
        Sign in
      </button>
    </form>
  );
}
