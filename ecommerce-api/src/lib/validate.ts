import { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface RequestSchemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

/**
 * Validates `params`, `query` and `body` with Zod and replaces them with the
 * parsed (coerced, defaulted) values. Responds 400 with per-field details.
 */
export function validate(schemas: RequestSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const key of ["params", "query", "body"] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key] ?? {});
      if (!result.success) {
        return res.status(400).json({
          error: "Datos inválidos",
          code: "VALIDATION_ERROR",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      (req as unknown as Record<string, unknown>)[key] = result.data;
    }
    return next();
  };
}
