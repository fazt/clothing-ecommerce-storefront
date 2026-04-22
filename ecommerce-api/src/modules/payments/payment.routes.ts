import { Router } from "express";
import { paymentController } from "./payment.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.post("/paypal/create", requireAuth, paymentController.createPaypal);
router.post("/paypal/capture", requireAuth, paymentController.capturePaypal);

export default router;
