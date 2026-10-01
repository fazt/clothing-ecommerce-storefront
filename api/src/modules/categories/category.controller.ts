import { Request, Response } from "express";
import { categoryService } from "./category.service";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "./category.schema";

export const categoryController = {
  list: async (req: Request, res: Response) => {
    try {
      res.json(await categoryService.findAll(req.query as unknown as ListCategoriesQuery));
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
      const category = await categoryService.create(req.body as CreateCategoryInput);
      res.status(201).json(category);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Ya existe una categoría con ese slug" });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const category = await categoryService.update(
        String(req.params.id),
        req.body as UpdateCategoryInput,
      );
      res.json(category);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Category not found" });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Ya existe una categoría con ese slug" });
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
