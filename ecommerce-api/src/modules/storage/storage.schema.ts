import { z } from "zod";

export const uploadBody = z.object({
  folder: z.enum(["products", "categories", "avatars"]).default("products"),
});

export type UploadInput = z.infer<typeof uploadBody>;
