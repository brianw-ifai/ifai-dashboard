"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, signUp, type AuthState } from "@/app/auth/actions";

type Props = {
  mode: "login" | "signup";
  next?: string;
  banner?: string;
};

export function AuthForm({ mode, next, banner }: Props) {
  const action = mode === "login" ? login : signUp;
  const [state, formAction, pending] = useActionState(action, null as AuthState);
  const [email, setEmail] = useState("");
  const error = state && "error" in state ? state.error : undefined;
  const notice = state && "notice" in state ? state.notice : undefined;
  const title = mode === "login" ? "Log in" : "Sign up";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fafafb] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e8ec] bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#8e8e99] uppercase">
          IntoFocus
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#16161a]">{title}</h1>
        <p className="mt-1 text-sm text-[#5c5c66]">
          {mode === "login"
            ? "Use the email and password for this dashboard."
            : "Create an account with your IntoFocus email."}
        </p>

        {banner ? (
          <p className="mt-4 rounded-lg bg-[#fdeceb] px-3 py-2 text-sm text-[#b3372c]">{banner}</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-lg bg-[#fdeceb] px-3 py-2 text-sm text-[#b3372c]">{error}</p>
        ) : null}
        {notice ? (
          <p className="mt-4 rounded-lg bg-[#eef8f1] px-3 py-2 text-sm text-[#1f7a3a]">{notice}</p>
        ) : null}

        <form action={formAction} className="mt-6 flex flex-col gap-3">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-[#16161a]">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-[#e8e8ec] px-3 py-2 font-normal outline-none focus:border-[#4b45c6]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#16161a]">
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="rounded-lg border border-[#e8e8ec] px-3 py-2 font-normal outline-none focus:border-[#4b45c6]"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-[#4b45c6] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Please wait…" : title}
          </button>
        </form>

        <p className="mt-5 text-sm text-[#5c5c66]">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-medium text-[#4b45c6]">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#4b45c6]">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
