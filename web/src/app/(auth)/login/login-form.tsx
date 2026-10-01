"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { formValues } from "@/lib/form-values";
import { loginSchema } from "@/lib/schemas/auth";
import { useApiForm } from "@/hooks/use-api-form";
import { AuthField } from "../auth-field";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { pending, errors, formError, run } = useApiForm(
    loginSchema,
    (values) => api.auth.login(values),
    ({ user }) => {
      const destination =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : user.role === "ADMIN"
            ? "/dashboard"
            : "/";
      router.push(destination);
      router.refresh();
    },
  );

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
      <AuthField
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password}
      />
      {formError && !errors.email && !errors.password ? (
        <p className="auth-error" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="auth-submit">
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
