"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function ActionForm({ action, children, className = "", successClassName = "" }: { action: Action; children: React.ReactNode; className?: string; successClassName?: string }) {
  const [state, formAction] = useActionState(action, undefined);
  return <form action={formAction} className={className}>{children}{state?.error && <p role="alert" className="form-message error">{state.error}</p>}{state?.success && <p role="status" className={`form-message success ${successClassName}`}>{state.success}</p>}</form>;
}

export function SubmitButton({ children, className = "button primary", pendingText = "Saving…", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" {...props} disabled={pending || props.disabled} className={className}>{pending ? pendingText : children}</button>;
}
