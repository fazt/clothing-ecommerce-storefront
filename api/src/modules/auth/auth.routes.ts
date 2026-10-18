import { Router } from "express";
import { authController } from "./auth.controller";
import googleRoutes from "./google.routes";
import { validate } from "../../lib/validate";
import {
  forgotPasswordBody,
  loginBody,
  registerBody,
  resetPasswordBody,
} from "./auth.schema";
import githubRoutes from "./github.routes";

const router = Router();

router.post("/register", validate({ body: registerBody }), authController.register);
router.post("/login", validate({ body: loginBody }), authController.login);
router.post("/logout", authController.logout);
router.post(
  "/forgot-password",
  validate({ body: forgotPasswordBody }),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate({ body: resetPasswordBody }),
  authController.resetPassword,
);

router.get("/providers", authController.providers);
router.use("/google", googleRoutes);
router.use("/github", githubRoutes);

export default router;
