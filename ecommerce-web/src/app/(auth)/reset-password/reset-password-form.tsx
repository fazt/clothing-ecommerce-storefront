"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordAction, type ResetPasswordState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="auth-submit">
      {pending ? "Actualizando..." : "Actualizar contraseña"}
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="auth-label">Nueva contraseña</label>
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
      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="auth-label">
          Confirma la contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Vuelve a escribirla"
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
