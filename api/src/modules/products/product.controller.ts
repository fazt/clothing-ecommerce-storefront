import { Request, Response } from "express";
import { productService } from "./product.service";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "./product.schema";

export const productController = {
  list: async (req: Request, res: Response) => {
    try {
      res.json(await productService.findAll(req.query as unknown as ListProductsQuery));
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
      const product = await productService.create(req.body as CreateProductInput);
      res.status(201).json(product);
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res.status(409).json({ error: "Una variante con ese SKU ya existe" });
      }
      if (error?.code === "P2003") {
        return res.status(400).json({ error: "La categoría no existe" });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const product = await productService.update(
        String(req.params.id),
        req.body as UpdateProductInput,
      );
      res.json(product);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Una variante con ese SKU ya existe" });
      }
      if (error.code === "P2003") {
        return res.status(400).json({ error: "La categoría no existe" });
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
      if (error.code === "P2003") {
        return res
          .status(409)
          .json({ error: "No se puede eliminar un producto con pedidos" });
      }
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
};
