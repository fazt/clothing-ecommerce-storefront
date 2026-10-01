import { Router } from "express";
import { analyticsController } from "./analytics.controller";

const router = Router();

router.get("/summary", analyticsController.summary);

export default router;
