import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { validate } from "../../lib/validate";

const productParams = z.object({ productId: z.string().min(1) });

// Montado en /api/me/wishlist (detrás de requireAuth): siempre la lista del usuario de la sesión.
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  res.json({ data: items.map((i) => ({ addedAt: i.createdAt, product: i.product })) });
});

/** Solo los ids (para pintar los corazones del catálogo sin traer los productos). */
router.get("/ids", async (req: Request, res: Response) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    select: { productId: true },
    take: 500,
  });
  res.json({ data: items.map((i) => i.productId) });
});

router.put("/:productId", validate({ params: productParams }), async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user!.id, productId } },
    update: {},
    create: { userId: req.user!.id, productId },
  });
  res.status(204).send();
});

router.delete("/:productId", validate({ params: productParams }), async (req: Request, res: Response) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user!.id, productId: String(req.params.productId) },
  });
  res.status(204).send();
});

export { router as wishlistRoutes };
