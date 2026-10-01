import { z } from "zod";

// The browser navigates to these routes, so bad input is dropped (`catch`)
// instead of answering with a 400 JSON page.
const optionalParam = z.string().max(2048).optional().catch(undefined);

// Only an internal web path ("/checkout"), never "//host", "/\host" or one
// with control characters, so the return address can't become an open redirect.
const internalPath = z
  .string()
  .max(512)
  .refine(
    (path) =>
      path.startsWith("/") &&
      !path.startsWith("//") &&
      !path.includes("\\") &&
      !/[\u0000-\u001f\u007f]/.test(path),
  );

export const githubStartQuery = z.object({
  redirect: internalPath.optional().catch(undefined),
});

export const githubCallbackQuery = z.object({
  code: optionalParam,
  state: optionalParam,
  error: optionalParam,
});

export type GithubStartQuery = z.infer<typeof githubStartQuery>;
export type GithubCallbackQuery = z.infer<typeof githubCallbackQuery>;
