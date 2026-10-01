import { Router } from "express";
import { newsletterController } from "./newsletter.controller";

const router = Router();

router.post("/", newsletterController.subscribe);

export default router;
