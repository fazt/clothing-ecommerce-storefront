import { Router } from "express";
import { userController } from "./user.controller";

const router = Router();

router.get("/", userController.list);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

export default router;
