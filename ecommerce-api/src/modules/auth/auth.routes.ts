import { Router } from "express";
import { authController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", requireAuth, authController.me);

export default router;
