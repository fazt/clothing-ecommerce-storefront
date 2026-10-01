import { Request, Response } from "express";
import { newsletterService } from "./newsletter.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const newsletterController = {
  subscribe: async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email ?? "").trim().toLowerCase();

      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "Invalid email" });
      }

      await newsletterService.subscribe(email);
      res.status(201).json({ ok: true, email });
    } catch {
      res.status(500).json({ error: "Failed to subscribe" });
    }
  },
};
