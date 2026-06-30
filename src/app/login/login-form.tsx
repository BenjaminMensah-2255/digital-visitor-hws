"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions";

function LoginButton() { const { pending } = useFormStatus(); return <button disabled={pending} className="button primary mt-2 w-full py-3.5" type="submit">{pending ? "Signing in…" : "Sign in to workspace"}</button>; }
export function LoginForm() {
  const [state, action] = useActionState(loginAction, undefined);
  return <form action={action} className="mt-7 space-y-4"><label className="field"><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label><label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label>{state?.error && <p role="alert" className="form-message error">{state.error}</p>}<LoginButton /></form>;
}
