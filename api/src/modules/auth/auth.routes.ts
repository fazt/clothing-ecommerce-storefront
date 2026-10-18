import { Router } from "express";
import { authController } from "./auth.controller";
import googleRoutes from "./google.routes";
import githubRoutes from "./github.routes";
import { validate } from "../../lib/validate";
import { loginLimiter, sensitiveLimiter } from "../../lib/rate-limit";
import {
  forgotPasswordBody,
  loginBody,
  registerBody,
  resetPasswordBody,
} from "./auth.schema";

const router = Router();

router.post("/register", sensitiveLimiter, validate({ body: registerBody }), authController.register);
router.post("/login", loginLimiter, validate({ body: loginBody }), authController.login);
router.post("/logout", authController.logout);
router.post(
  "/forgot-password",
  sensitiveLimiter,
  validate({ body: forgotPasswordBody }),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  loginLimiter,
  validate({ body: resetPasswordBody }),
  authController.resetPassword,
);

router.get("/providers", authController.providers);
router.use("/google", googleRoutes);
router.use("/github", githubRoutes);

export default router;
