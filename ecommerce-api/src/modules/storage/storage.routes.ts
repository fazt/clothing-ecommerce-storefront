import { Router } from "express";
import multer from "multer";
import { storageController } from "./storage.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const router = Router();

router.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  storageController.upload,
);

export default router;
