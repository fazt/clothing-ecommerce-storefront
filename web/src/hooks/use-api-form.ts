"use client";

import { useState } from "react";
import type { z } from "zod";
import { ApiError } from "@/lib/api-client";

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/**
 * Validates raw form input with a Zod schema, sends the parsed values to the
 * API and maps API validation details back onto fields.
 */
export function useApiForm<Schema extends z.ZodType, Result>(
  schema: Schema,
  submit: (values: z.output<Schema>) => Promise<Result>,
  onSuccess?: (result: Result) => void | Promise<void>,
) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function run(input: unknown) {
    setFormError(null);
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await submit(parsed.data);
      await onSuccess?.(result);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors);
        setFormError(e.message);
      } else {
        setFormError(e instanceof Error ? e.message : "Algo salió mal");
      }
    } finally {
      setPending(false);
    }
  }

  return { pending, errors, formError, run };
}
