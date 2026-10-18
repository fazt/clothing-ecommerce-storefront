import { Router } from "express";
import { orderController } from "./order.controller";
import { validate } from "../../lib/validate";
import { idParams } from "../../lib/pagination";
import { createOrderBody, listOrdersQuery, updateOrderBody } from "./order.schema";

// Montado detrás de requireAuth + requireAdmin. Los pedidos del cliente viven en GET /me/orders.
const router = Router();

router.get("/", validate({ query: listOrdersQuery }), orderController.list);
router.get("/:id", validate({ params: idParams }), orderController.getById);
router.post("/", validate({ body: createOrderBody }), orderController.create);
router.patch("/:id", validate({ params: idParams, body: updateOrderBody }), orderController.update);
router.post("/:id/refund", validate({ params: idParams }), orderController.refund);
router.delete("/:id", validate({ params: idParams }), orderController.remove);

export default router;
