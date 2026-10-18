import { Router } from "express";
import { newsletterController, subscribeBody } from "./newsletter.controller";
import { validate } from "../../lib/validate";
import { sensitiveLimiter } from "../../lib/rate-limit";

const router = Router();

router.post("/", sensitiveLimiter, validate({ body: subscribeBody }), newsletterController.subscribe);

export default router;
