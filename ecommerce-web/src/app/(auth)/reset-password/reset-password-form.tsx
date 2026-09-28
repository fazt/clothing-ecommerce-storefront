"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { formValues } from "@/lib/form-values";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { useApiForm } from "@/hooks/use-api-form";
import { AuthField } from "../auth-field";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { pending, errors, formError, run } = useApiForm(
    resetPasswordSchema,
    (values) => api.auth.resetPassword(values.token, values.password),
    () => router.push("/login?reset=1"),
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void run({ ...formValues(e.currentTarget), token });
      }}
      className="flex flex-col gap-5"
    >
      <AuthField
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="Al menos 6 caracteres"
        error={errors.password}
      />
      <AuthField
        id="confirmPassword"
        label="Confirma la contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="Vuelve a escribirla"
        error={errors.confirmPassword}
      />
      {errors.token || formError ? (
        <p className="auth-error" role="alert">
          {errors.token ?? formError}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="auth-submit">
        {pending ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
