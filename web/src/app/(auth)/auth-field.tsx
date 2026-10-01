import type { ComponentProps } from "react";

export function AuthField({
  label,
  error,
  id,
  ...input
}: ComponentProps<"input"> & { id: string; label: string; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="auth-input"
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
