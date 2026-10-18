import { env, isTest } from "./config/env";
import { logger } from "./lib/logger";
import { checkoutService } from "./modules/payments/checkout.service";

/**
 * Tareas periódicas en el mismo proceso: vencer órdenes PENDING cuya reserva caducó
 * (liberan stock y cupón). Con varias réplicas, activar JOBS_ENABLED solo en una.
 */
export function startJobs(): () => void {
  const enabled = env.JOBS_ENABLED ?? !isTest;
  if (!enabled) return () => undefined;

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const expired = await checkoutService.expireStaleOrders();
      if (expired > 0) logger.info({ expired }, "órdenes pendientes vencidas");
    } catch (err) {
      logger.error({ err }, "job: no se pudieron vencer órdenes");
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, env.JOBS_INTERVAL_MS);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}
