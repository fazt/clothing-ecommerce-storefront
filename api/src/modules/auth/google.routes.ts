import { Router } from "express";
import { googleController } from "./google.controller";
import { validate } from "../../lib/validate";
import { googleCallbackQuery, googleStartQuery } from "./google.schema";

// Mounted at /auth/google. Both routes are browser navigations that end in a
// redirect, never JSON.
const router = Router();

router.get("/", validate({ query: googleStartQuery }), googleController.start);
router.get("/callback", validate({ query: googleCallbackQuery }), googleController.callback);

export default router;
