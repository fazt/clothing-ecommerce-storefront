import { Router } from "express";
import { orderController } from "./order.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";

const router = Router();

// Authenticated user (any role): own orders
router.get("/mine", requireAuth, orderController.listMine);

// Admin-only
router.get("/", requireAuth, requireAdmin, orderController.list);
router.get("/:id", requireAuth, requireAdmin, orderController.getById);
router.post("/", requireAuth, requireAdmin, orderController.create);
router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  orderController.updateStatus,
);
router.delete("/:id", requireAuth, requireAdmin, orderController.remove);

export default router;
