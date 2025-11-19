"use client";

import { useActionState } from "react";
import { signInAction, type AuthFormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: AuthFormState = { message: null };

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  return (
    <form action={formAction} className="card space-y-5 p-6">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-2"
          placeholder="you@yuktra.ai"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-2"
          placeholder="••••••••"
        />
      </div>
      {state?.message && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </p>
      )}
      <Button type="submit" fullWidth>
        Sign in
      </Button>
    </form>
  );
}
