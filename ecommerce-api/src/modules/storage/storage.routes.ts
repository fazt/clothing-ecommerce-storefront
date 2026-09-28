import { Router } from "express";
import multer from "multer";
import { storageController } from "./storage.controller";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { uploadBody } from "./storage.schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const router = Router();

// multer runs first so the multipart `folder` field is available to Zod.
router.post(
  "/",
  requireAuth,
  upload.single("file"),
  validate({ body: uploadBody }),
  storageController.upload,
);

export default router;
