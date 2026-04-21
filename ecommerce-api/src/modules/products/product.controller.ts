import { Request, Response } from "express";
import { productService } from "./product.service";

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
      const product = await productService.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name, description, price, stock, imageUrl } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({ error: "name and price are required" });
      }

      const product = await productService.create({
        name,
        description,
        price,
        stock,
        imageUrl,
      });
      res.status(201).json(product);
    } catch {
      res.status(500).json({ error: "Failed to create product" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const product = await productService.update(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await productService.remove(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
};
