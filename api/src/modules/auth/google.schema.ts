import { z } from "zod";

// The browser navigates to these routes, so bad input is dropped (`catch`)
// instead of answering with a 400 JSON page.
const optionalParam = z.string().max(2048).optional().catch(undefined);

// Only an internal web path ("/checkout"), never "//host" or "/\host", so the
// return address can't become an open redirect.
const internalPath = z
  .string()
  .max(512)
  .refine((path) => path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"));

export const googleStartQuery = z.object({
  redirect: internalPath.optional().catch(undefined),
});

export const googleCallbackQuery = z.object({
  code: optionalParam,
  state: optionalParam,
  error: optionalParam,
});

export type GoogleStartQuery = z.infer<typeof googleStartQuery>;
export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuery>;
