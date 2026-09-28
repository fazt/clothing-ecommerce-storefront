import { Router } from "express";
import { meController } from "./me.controller";
import { validate } from "../../lib/validate";
import { paginationQuery } from "../../lib/pagination";
import { changePasswordBody, updateMeBody } from "./me.schema";

// Mounted behind requireAuth: every route acts on the signed-in user.
const router = Router();

router.get("/", meController.get);
router.patch("/", validate({ body: updateMeBody }), meController.update);
router.put("/password", validate({ body: changePasswordBody }), meController.changePassword);
router.get("/orders", validate({ query: paginationQuery }), meController.listOrders);

export default router;
