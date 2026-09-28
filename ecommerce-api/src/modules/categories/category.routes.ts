import { Router } from "express";
import { categoryController } from "./category.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { idParams } from "../../lib/pagination";
import {
  createCategoryBody,
  listCategoriesQuery,
  updateCategoryBody,
} from "./category.schema";

const router = Router();

router.get("/", validate({ query: listCategoriesQuery }), categoryController.list);
router.get("/:id", validate({ params: idParams }), categoryController.getById);
router.post(
  "/",
  requireAuth,
  requireAdmin,
  validate({ body: createCategoryBody }),
  categoryController.create,
);
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate({ params: idParams, body: updateCategoryBody }),
  categoryController.update,
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate({ params: idParams }),
  categoryController.remove,
);

export default router;
