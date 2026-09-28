import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../lib/validate";
import {
  forgotPasswordBody,
  loginBody,
  registerBody,
  resetPasswordBody,
} from "./auth.schema";

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

export default router;
