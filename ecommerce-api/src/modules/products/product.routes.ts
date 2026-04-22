import { Router } from "express";
import { productController } from "./product.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";

const router = Router();

router.get("/", productController.list);
router.get("/:id", productController.getById);
router.post("/", requireAuth, requireAdmin, productController.create);
router.put("/:id", requireAuth, requireAdmin, productController.update);
router.delete("/:id", requireAuth, requireAdmin, productController.remove);

export default router;
