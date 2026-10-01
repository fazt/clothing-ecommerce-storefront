"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { formValues } from "@/lib/form-values";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { useApiForm } from "@/hooks/use-api-form";
import { AuthField } from "../auth-field";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { pending, errors, formError, run } = useApiForm(
    forgotPasswordSchema,
    (values) => api.auth.forgotPassword(values.email),
    () => setSent(true),
  );

  if (sent) {
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
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void run(formValues(e.currentTarget));
      }}
      className="flex flex-col gap-5"
    >
      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        error={errors.email}
      />
      {formError && !errors.email ? (
        <p className="auth-error" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="auth-submit">
        {pending ? "Enviando..." : "Enviar enlace"}
      </button>
    </form>
  );
}
