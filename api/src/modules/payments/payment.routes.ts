import { Router } from "express";
import { paymentController } from "./payment.controller";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { checkoutLimiter } from "../../lib/rate-limit";
import { checkoutBody, confirmBody, orderIdParams, quoteBody, simulateBody } from "./checkout.schema";

// Montado en /api/checkout.
const router = Router();

router.get("/methods", paymentController.methods);
router.post("/quote", validate({ body: quoteBody }), paymentController.quote);
router.post("/", requireAuth, checkoutLimiter, validate({ body: checkoutBody }), paymentController.create);
router.get("/orders/:id", requireAuth, validate({ params: orderIdParams }), paymentController.getOrder);
router.post(
  "/orders/:id/confirm",
  requireAuth,
  validate({ params: orderIdParams, body: confirmBody }),
  paymentController.confirm,
);
router.post("/orders/:id/cancel", requireAuth, validate({ params: orderIdParams }), paymentController.cancel);
router.post(
  "/orders/:id/simulate",
  requireAuth,
  validate({ params: orderIdParams, body: simulateBody }),
  paymentController.simulate,
);

export default router;
