import { Request, Response } from "express";
import { productService, type ProductVariantInput } from "./product.service";

function parseVariants(raw: unknown): ProductVariantInput[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object")
    .map((v: any) => ({
      size: typeof v.size === "string" && v.size.trim() ? v.size.trim() : null,
      color:
        typeof v.color === "string" && v.color.trim() ? v.color.trim() : null,
      sku: typeof v.sku === "string" && v.sku.trim() ? v.sku.trim() : null,
      stock: Number.isFinite(Number(v.stock)) ? Number(v.stock) : 0,
      price:
        v.price === null || v.price === undefined || v.price === ""
          ? null
          : v.price,
    }))
    .filter((v) => v.size !== null || v.color !== null);
}

function parseImages(raw: unknown): string[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string" && s.length > 0);
}

export const productController = {
  list: async (_req: Request, res: Response) => {
    try {
      const products = await productService.findAll();
      res.json(products);
    } catch {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const product = await productService.findById(String(req.params.id));
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        price,
        stock,
        imageUrl,
        images,
        isNew,
        isSale,
        isFeatured,
        categoryId,
        variants,
      } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({ error: "name and price are required" });
      }

      const product = await productService.create({
        name,
        description,
        price,
        stock,
        imageUrl,
        images: parseImages(images),
        isNew: !!isNew,
        isSale: !!isSale,
        isFeatured: !!isFeatured,
        categoryId: categoryId || null,
        variants: parseVariants(variants),
      });
      res.status(201).json(product);
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res
          .status(409)
          .json({ error: "Una variante con ese SKU ya existe" });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        price,
        stock,
        imageUrl,
        images,
        isNew,
        isSale,
        isFeatured,
        categoryId,
        variants,
      } = req.body;
      const product = await productService.update(String(req.params.id), {
        name,
        description,
        price,
        stock,
        imageUrl,
        ...(images !== undefined && { images: parseImages(images) }),
        ...(isNew !== undefined && { isNew: !!isNew }),
        ...(isSale !== undefined && { isSale: !!isSale }),
        ...(isFeatured !== undefined && { isFeatured: !!isFeatured }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(variants !== undefined && { variants: parseVariants(variants) }),
      });
      res.json(product);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ error: "Una variante con ese SKU ya existe" });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await productService.remove(String(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
};
