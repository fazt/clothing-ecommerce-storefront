import { Router } from "express";
import { paymentController } from "./payment.controller";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { captureParams, checkoutBody, stripeSessionParams } from "./payment.schema";

const router = Router();

router.get("/methods", paymentController.methods);

router.post(
  "/paypal/orders",
  requireAuth,
  validate({ body: checkoutBody }),
  paymentController.createPaypal,
);
router.post(
  "/paypal/orders/:paypalOrderId/capture",
  requireAuth,
  validate({ params: captureParams }),
  paymentController.capturePaypal,
);

router.post(
  "/stripe/sessions",
  requireAuth,
  validate({ body: checkoutBody }),
  paymentController.createStripe,
);
router.post(
  "/stripe/sessions/:sessionId/confirm",
  requireAuth,
  validate({ params: stripeSessionParams }),
  paymentController.confirmStripe,
);
// Called by Stripe, authenticated by signature. Its body stays raw (see index.ts).
router.post("/stripe/webhook", paymentController.stripeWebhook);

export default router;
