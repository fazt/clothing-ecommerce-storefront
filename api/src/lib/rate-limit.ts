import rateLimit, { type Options } from "express-rate-limit";
import { isTest } from "../config/env";

const base: Partial<Options> = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // En tests los límites estorban (muchas peticiones seguidas desde la misma IP).
  skip: () => isTest,
  message: { error: "Demasiadas solicitudes, inténtalo más tarde", code: "RATE_LIMITED" },
};

/** Límite global de la API por IP. */
export const apiLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 300 });

/** Login: solo cuentan los intentos fallidos (un usuario legítimo no se bloquea). */
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
});

/**
 * Registro, «olvidé mi contraseña», newsletter y reseñas: responden 2xx incluso cuando no hacen nada
 * (para no revelar si un email existe), así que se limita CADA petición, no solo las fallidas.
 */
export const sensitiveLimiter = rateLimit({ ...base, windowMs: 60 * 60_000, limit: 8 });

/** Checkout: crear órdenes retiene stock; se limita para que nadie vacíe el inventario. */
export const checkoutLimiter = rateLimit({ ...base, windowMs: 10 * 60_000, limit: 20 });
