import { Router } from "express";
import { paymentController } from "./payment.controller";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { captureParams, createPaypalOrderBody } from "./payment.schema";

const router = Router();

router.post(
  "/paypal/orders",
  requireAuth,
  validate({ body: createPaypalOrderBody }),
  paymentController.createPaypal,
);
router.post(
  "/paypal/orders/:paypalOrderId/capture",
  requireAuth,
  validate({ params: captureParams }),
  paymentController.capturePaypal,
);

export default router;
