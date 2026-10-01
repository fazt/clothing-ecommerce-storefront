import { Router } from "express";
import { userController } from "./user.controller";
import { validate } from "../../lib/validate";
import { idParams } from "../../lib/pagination";
import { createUserBody, listUsersQuery, updateUserBody } from "./user.schema";

const router = Router();

router.get("/", validate({ query: listUsersQuery }), userController.list);
router.get("/:id", validate({ params: idParams }), userController.getById);
router.post("/", validate({ body: createUserBody }), userController.create);
router.patch(
  "/:id",
  validate({ params: idParams, body: updateUserBody }),
  userController.update,
);
router.delete("/:id", validate({ params: idParams }), userController.remove);

export default router;
