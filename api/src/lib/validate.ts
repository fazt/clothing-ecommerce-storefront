import { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface RequestSchemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

/**
 * Valida `params`, `query` y `body` con Zod y los reemplaza por los valores parseados
 * (coaccionados y con defaults). Responde 400 con el detalle por campo.
 *
 * Express 5 expone `req.query` como getter de solo lectura: se redefine como propiedad
 * propia de la petición en lugar de asignarlo.
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
      Object.defineProperty(req, key, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    return next();
  };
}
