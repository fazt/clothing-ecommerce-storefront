import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { validate } from "../../lib/validate";
import { idParams, pageArgs, paginated, paginationQuery, type PaginationQuery } from "../../lib/pagination";
import { sensitiveLimiter } from "../../lib/rate-limit";
import { requireAdmin, requireAuth } from "../../middleware/auth";
import { PAID_STATUSES } from "../payments";

const productParams = z.object({ id: z.string().min(1) });

const reviewBody = z.object({
  rating: z.coerce.number().int().min(1, { error: "Elige de 1 a 5 estrellas" }).max(5),
  title: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => v || null),
  body: z.string().trim().min(10, { error: "Cuéntanos un poco más (mínimo 10 caracteres)" }).max(2000),
});

const adminListQuery = paginationQuery.extend({
  status: z.enum(["PUBLISHED", "HIDDEN"]).optional(),
});

const moderateBody = z.object({ status: z.enum(["PUBLISHED", "HIDDEN"]) });

/** Datos públicos de una reseña: el nombre del autor, nunca su email. */
const publicSelect = {
  id: true,
  rating: true,
  title: true,
  body: true,
  verified: true,
  createdAt: true,
  user: { select: { name: true, avatarUrl: true } },
} satisfies Prisma.ReviewSelect;

/** Recalcula el promedio y el total de reseñas PUBLICADAS del producto. */
async function refreshProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)),
      ratingCount: agg._count._all,
    },
  });
}

/** ¿El usuario compró (y pagó) este producto? */
async function hasPurchased(userId: string, productId: string) {
  const item = await prisma.orderItem.findFirst({
    where: { productId, order: { userId, status: { in: PAID_STATUSES } } },
    select: { id: true },
  });
  return Boolean(item);
}

/** Rutas bajo /api/products/:id/reviews. */
export const productReviewRoutes = Router({ mergeParams: true });

productReviewRoutes.get(
  "/",
  validate({ params: productParams, query: paginationQuery }),
  async (req: Request, res: Response) => {
    const productId = String(req.params.id);
    const query = req.query as unknown as PaginationQuery;
    const where = { productId, status: "PUBLISHED" as const };
    const [reviews, total, distribution] = await Promise.all([
      prisma.review.findMany({ where, orderBy: { createdAt: "desc" }, select: publicSelect, ...pageArgs(query) }),
      prisma.review.count({ where }),
      prisma.review.groupBy({ by: ["rating"], where, _count: { _all: true } }),
    ]);
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distribution) counts[row.rating] = row._count._all;
    const sum = Object.entries(counts).reduce((s, [r, n]) => s + Number(r) * n, 0);
    res.json({
      ...paginated(reviews, total, query),
      summary: { average: total ? Number((sum / total).toFixed(2)) : 0, count: total, distribution: counts },
    });
  },
);

/** Reseña propia del usuario (para editarla). */
productReviewRoutes.get("/mine", requireAuth, validate({ params: productParams }), async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const [review, purchased] = await Promise.all([
    prisma.review.findUnique({ where: { productId_userId: { productId, userId: req.user!.id } } }),
    hasPurchased(req.user!.id, productId),
  ]);
  res.json({ review, purchased });
});

/** Crear o editar la reseña propia (una por producto y usuario). */
productReviewRoutes.put(
  "/mine",
  requireAuth,
  sensitiveLimiter,
  validate({ params: productParams, body: reviewBody }),
  async (req: Request, res: Response) => {
    const productId = String(req.params.id);
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    const data = req.body as z.infer<typeof reviewBody>;
    const verified = await hasPurchased(req.user!.id, productId);
    const review = await prisma.review.upsert({
      where: { productId_userId: { productId, userId: req.user!.id } },
      // Editar no saca una reseña de la moderación: si estaba oculta, sigue oculta.
      update: { ...data, verified },
      create: { ...data, verified, productId, userId: req.user!.id },
      select: publicSelect,
    });
    await refreshProductRating(productId);
    res.json(review);
  },
);

productReviewRoutes.delete("/mine", requireAuth, validate({ params: productParams }), async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  await prisma.review.deleteMany({ where: { productId, userId: req.user!.id } });
  await refreshProductRating(productId);
  res.status(204).send();
});

/** Moderación: /api/reviews (ADMIN). */
export const reviewAdminRoutes = Router();
reviewAdminRoutes.use(requireAuth, requireAdmin);

reviewAdminRoutes.get("/", validate({ query: adminListQuery }), async (req: Request, res: Response) => {
  const query = req.query as unknown as z.infer<typeof adminListQuery>;
  const where: Prisma.ReviewWhereInput = {
    ...(query.status && { status: query.status }),
    ...(query.search && {
      OR: [
        { body: { contains: query.search, mode: "insensitive" } },
        { title: { contains: query.search, mode: "insensitive" } },
        { product: { name: { contains: query.search, mode: "insensitive" } } },
      ],
    }),
  };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
      ...pageArgs(query),
    }),
    prisma.review.count({ where }),
  ]);
  res.json(paginated(reviews, total, query));
});

reviewAdminRoutes.patch("/:id", validate({ params: idParams, body: moderateBody }), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await prisma.review.findUnique({ where: { id }, select: { productId: true } });
  if (!existing) return res.status(404).json({ error: "Reseña no encontrada" });
  const review = await prisma.review.update({
    where: { id },
    data: { status: (req.body as z.infer<typeof moderateBody>).status },
  });
  await refreshProductRating(existing.productId);
  res.json(review);
});

reviewAdminRoutes.delete("/:id", validate({ params: idParams }), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await prisma.review.findUnique({ where: { id }, select: { productId: true } });
  if (!existing) return res.status(404).json({ error: "Reseña no encontrada" });
  await prisma.review.delete({ where: { id } });
  await refreshProductRating(existing.productId);
  res.status(204).send();
});
