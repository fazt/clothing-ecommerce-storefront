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
import { checkoutRoutes } from "./modules/payments";
import { storageRoutes } from "./modules/storage";
import { newsletterRoutes } from "./modules/newsletter";
import { shippingRoutes } from "./modules/shipping";
import { wishlistRoutes } from "./modules/wishlist";
import { productReviewRoutes, reviewAdminRoutes } from "./modules/reviews";
import { requireAuth, requireAdmin } from "./middleware/auth";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me/wishlist", requireAuth, wishlistRoutes);
router.use("/me", requireAuth, meRoutes);
router.use("/products/:id/reviews", productReviewRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/shipping-methods", shippingRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/reviews", reviewAdminRoutes);
router.use("/customers", requireAuth, requireAdmin, customerRoutes);
router.use("/orders", requireAuth, requireAdmin, orderRoutes);
router.use("/discounts", requireAuth, requireAdmin, discountRoutes);
router.use("/analytics", requireAuth, requireAdmin, analyticsRoutes);
router.use("/users", requireAuth, requireAdmin, userRoutes);
router.use("/uploads", storageRoutes);
router.use("/newsletter", newsletterRoutes);

export default router;
