import { Router } from "express";
import { productController } from "./product.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { idParams } from "../../lib/pagination";
import { createProductBody, listProductsQuery, updateProductBody } from "./product.schema";

const router = Router();

router.get("/", validate({ query: listProductsQuery }), productController.list);
router.get("/:id", validate({ params: idParams }), productController.getById);
router.post(
  "/",
  requireAuth,
  requireAdmin,
  validate({ body: createProductBody }),
  productController.create,
);
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate({ params: idParams, body: updateProductBody }),
  productController.update,
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate({ params: idParams }),
  productController.remove,
);

export default router;
