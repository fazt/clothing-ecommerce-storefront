import { Router } from "express";
import { authRoutes } from "./modules/auth";
import { meRoutes } from "./modules/me";
import { productRoutes } from "./modules/products";
import { categoryRoutes } from "./modules/categories";
import { customerRoutes } from "./modules/customers";
import { orderRoutes } from "./modules/orders";
import { discountRoutes } from "./modules/discounts";
import { analyticsRoutes } from "./modules/analytics";
import { userRoutes } from "./modules/users";
import { paymentRoutes } from "./modules/payments";
import { storageRoutes } from "./modules/storage";
import { newsletterRoutes } from "./modules/newsletter";
import { requireAuth, requireAdmin } from "./middleware/auth";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me", requireAuth, meRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/customers", requireAuth, requireAdmin, customerRoutes);
router.use("/orders", requireAuth, requireAdmin, orderRoutes);
router.use("/discounts", requireAuth, requireAdmin, discountRoutes);
router.use("/analytics", requireAuth, requireAdmin, analyticsRoutes);
router.use("/users", requireAuth, requireAdmin, userRoutes);
router.use("/payments", paymentRoutes);
router.use("/uploads", storageRoutes);
router.use("/newsletter", newsletterRoutes);

export default router;
