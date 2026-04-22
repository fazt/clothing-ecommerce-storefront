"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MailCheck } from "lucide-react";
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="auth-submit">
      {pending ? "Enviando..." : "Enviar enlace"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ForgotPasswordState, FormData>(
    forgotPasswordAction,
    undefined,
  );

  if (state?.sent) {
    return (
      <div
        className="flex flex-col items-start gap-3 rounded-lg border p-5"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-soft)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "color-mix(in oklab, #059669 15%, transparent)", color: "#059669" }}
        >
          <MailCheck className="h-5 w-5" />
        </div>
        <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          Revisa tu bandeja de entrada
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          Si tu email está registrado, te hemos enviado un enlace válido por 1
          hora para restablecer tu contraseña.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="auth-label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
          className="auth-input"
        />
      </div>
      {state?.error ? (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
