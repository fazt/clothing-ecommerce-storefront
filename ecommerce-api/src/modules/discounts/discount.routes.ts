import { Router } from "express";
import { discountController } from "./discount.controller";

const router = Router();

router.get("/", discountController.list);
router.get("/:id", discountController.getById);
router.post("/", discountController.create);
router.put("/:id", discountController.update);
router.delete("/:id", discountController.remove);

export default router;
