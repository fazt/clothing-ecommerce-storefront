import { Router } from "express";
import { discountController } from "./discount.controller";
import { validate } from "../../lib/validate";
import { idParams } from "../../lib/pagination";
import {
  createDiscountBody,
  listDiscountsQuery,
  updateDiscountBody,
} from "./discount.schema";

const router = Router();

router.get("/", validate({ query: listDiscountsQuery }), discountController.list);
router.get("/:id", validate({ params: idParams }), discountController.getById);
router.post("/", validate({ body: createDiscountBody }), discountController.create);
router.patch(
  "/:id",
  validate({ params: idParams, body: updateDiscountBody }),
  discountController.update,
);
router.delete("/:id", validate({ params: idParams }), discountController.remove);

export default router;
