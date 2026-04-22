import { Request, Response } from "express";
import { categoryService } from "./category.service";

export const categoryController = {
  list: async (_req: Request, res: Response) => {
    try {
      const categories = await categoryService.findAll();
      res.json(categories);
    } catch {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const category = await categoryService.findById(String(req.params.id));
      if (!category) return res.status(404).json({ error: "Category not found" });
      res.json(category);
    } catch {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { slug, name, image, isVisible } = req.body;
      if (!slug || !name) {
        return res.status(400).json({ error: "slug and name are required" });
      }
      const category = await categoryService.create({ slug, name, image, isVisible });
      res.status(201).json(category);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Slug already exists" });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const category = await categoryService.update(String(req.params.id), req.body);
      res.json(category);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Category not found" });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Slug already exists" });
      }
      res.status(500).json({ error: "Failed to update category" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await categoryService.remove(String(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(500).json({ error: "Failed to delete category" });
    }
  },
};
