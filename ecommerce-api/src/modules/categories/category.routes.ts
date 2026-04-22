import { Router } from "express";
import { categoryController } from "./category.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";

const router = Router();

router.get("/", categoryController.list);
router.get("/:id", categoryController.getById);
router.post("/", requireAuth, requireAdmin, categoryController.create);
router.put("/:id", requireAuth, requireAdmin, categoryController.update);
router.delete("/:id", requireAuth, requireAdmin, categoryController.remove);

export default router;
