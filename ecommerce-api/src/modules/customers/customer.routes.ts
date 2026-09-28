import { Router } from "express";
import { customerController } from "./customer.controller";
import { validate } from "../../lib/validate";
import { idParams } from "../../lib/pagination";
import {
  createCustomerBody,
  listCustomersQuery,
  updateCustomerBody,
} from "./customer.schema";

const router = Router();

router.get("/", validate({ query: listCustomersQuery }), customerController.list);
router.get("/:id", validate({ params: idParams }), customerController.getById);
router.post("/", validate({ body: createCustomerBody }), customerController.create);
router.patch(
  "/:id",
  validate({ params: idParams, body: updateCustomerBody }),
  customerController.update,
);
router.delete("/:id", validate({ params: idParams }), customerController.remove);

export default router;
