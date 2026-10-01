import { Router } from "express";
import { githubController } from "./github.controller";
import { validate } from "../../lib/validate";
import { githubCallbackQuery, githubStartQuery } from "./github.schema";

// Mounted at /auth/github. Both routes are browser navigations that end in a
// redirect, never JSON.
const router = Router();

router.get("/", validate({ query: githubStartQuery }), githubController.start);
router.get("/callback", validate({ query: githubCallbackQuery }), githubController.callback);

export default router;
