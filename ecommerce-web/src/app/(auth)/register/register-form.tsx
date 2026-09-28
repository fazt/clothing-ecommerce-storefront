"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { formValues } from "@/lib/form-values";
import { registerSchema } from "@/lib/schemas/auth";
import { useApiForm } from "@/hooks/use-api-form";
import { AuthField } from "../auth-field";

export function RegisterForm() {
  const router = useRouter();
  const { pending, errors, formError, run } = useApiForm(
    registerSchema,
    (values) => api.auth.register(values),
    () => {
      router.push("/");
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
        id="name"
        label="Nombre"
        type="text"
        autoComplete="name"
        placeholder="Tu nombre (opcional)"
        error={errors.name}
      />
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
        autoComplete="new-password"
        placeholder="Al menos 6 caracteres"
        error={errors.password}
      />
      {formError && Object.keys(errors).length === 0 ? (
        <p className="auth-error" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="auth-submit">
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
