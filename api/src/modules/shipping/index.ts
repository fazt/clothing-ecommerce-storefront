import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { validate } from "../../lib/validate";
import { idParams } from "../../lib/pagination";
import { requireAdmin, requireAuth } from "../../middleware/auth";

const money = z.coerce.number({ error: "Monto inválido" }).min(0, { error: "No puede ser negativo" }).max(99_999);

// Sin defaults en los campos: el PATCH parcial no debe resetear lo que no se envía.
const fields = z.object({
  name: z.string().trim().min(2, { error: "El nombre es obligatorio" }).max(80),
  description: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null)
    .nullable(),
  price: money,
  freeOver: z.preprocess((v) => (v === "" ? null : v), money.nullable()),
  minDays: z.coerce.number().int().min(0).max(60),
  maxDays: z.coerce.number().int().min(0).max(90),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

const daysOrdered = (v: { minDays?: number; maxDays?: number }) =>
  v.minDays === undefined || v.maxDays === undefined || v.minDays <= v.maxDays;
const daysIssue = { error: "El mínimo de días no puede superar al máximo", path: ["maxDays"] };

const createBody = fields
  .extend({
    description: fields.shape.description.optional(),
    freeOver: fields.shape.freeOver.optional(),
    minDays: fields.shape.minDays.default(2),
    maxDays: fields.shape.maxDays.default(5),
    isActive: z.boolean().default(true),
    sortOrder: fields.shape.sortOrder.default(0),
  })
  .refine(daysOrdered, daysIssue);
const updateBody = fields.partial().refine(daysOrdered, daysIssue);

const publicSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  freeOver: true,
  minDays: true,
  maxDays: true,
} as const;

const router = Router();

/** Métodos activos (checkout). */
router.get("/", async (_req: Request, res: Response) => {
  const methods = await prisma.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    select: publicSelect,
  });
  res.json({ data: methods });
});

/** Todos, incluidos los inactivos (panel). */
router.get("/all", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const methods = await prisma.shippingMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { orders: true } } },
  });
  res.json({ data: methods });
});

router.post("/", requireAuth, requireAdmin, validate({ body: createBody }), async (req: Request, res: Response) => {
  const method = await prisma.shippingMethod.create({ data: req.body as z.infer<typeof createBody> });
  res.status(201).json(method);
});

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate({ params: idParams, body: updateBody }),
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body as z.infer<typeof updateBody>;
    const current = await prisma.shippingMethod.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: "Método de envío no encontrado" });
    const minDays = data.minDays ?? current.minDays;
    const maxDays = data.maxDays ?? current.maxDays;
    if (minDays > maxDays) {
      return res.status(400).json({ error: "El mínimo de días no puede superar al máximo", code: "VALIDATION_ERROR" });
    }
    res.json(await prisma.shippingMethod.update({ where: { id }, data }));
  },
);

/** Borrar uno con pedidos lo desactiva (los pedidos guardan la referencia). */
router.delete("/:id", requireAuth, requireAdmin, validate({ params: idParams }), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const current = await prisma.shippingMethod.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });
  if (!current) return res.status(404).json({ error: "Método de envío no encontrado" });
  if (current._count.orders > 0) {
    await prisma.shippingMethod.update({ where: { id }, data: { isActive: false } });
    return res.json({ ok: true, deactivated: true });
  }
  await prisma.shippingMethod.delete({ where: { id } });
  res.status(204).send();
});

export { router as shippingRoutes };
