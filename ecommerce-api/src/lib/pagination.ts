import { z } from "zod";

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;

/** Query-string boolean: only the literals "true" / "false" are accepted. */
export const booleanQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const idParams = z.object({ id: z.string().min(1) });

export function pageArgs({ page, pageSize }: PaginationQuery) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function paginated<T>(
  data: T[],
  total: number,
  { page, pageSize }: PaginationQuery,
): Paginated<T> {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

/** Case-insensitive `contains` filter for Prisma string fields. */
export function contains(search: string) {
  return { contains: search, mode: "insensitive" as const };
}
