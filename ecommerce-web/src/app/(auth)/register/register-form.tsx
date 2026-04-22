"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction, type AuthActionState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="auth-submit">
      {pending ? "Creando cuenta..." : "Crear cuenta"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    registerAction,
    undefined,
  );
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="auth-label">Nombre</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Tu nombre (opcional)"
          className="auth-input"
        />
      </div>
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
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="auth-label">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Al menos 6 caracteres"
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
