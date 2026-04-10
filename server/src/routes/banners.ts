import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminGuard.js";

const router = Router();

const bannerSchema = z.object({
  image_url: z.string().url(),
  link_url: z.string().url().optional().default(""),
  position: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
});

// GET /api/banners — banners ativos (público)
router.get("/", async (_req: Request, res: Response) => {
  const { data } = await supabaseAdmin
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });

  return res.json(data ?? []);
});

// POST /api/banners — criar banner (admin)
router.post("/", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const parse = bannerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { data, error } = await supabaseAdmin
    .from("banners")
    .insert(parse.data)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/banners/:id — editar banner (admin)
router.put("/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const parse = bannerSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { data, error } = await supabaseAdmin
    .from("banners")
    .update(parse.data)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/banners/:id — deletar banner (admin)
router.delete("/:id", requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  await supabaseAdmin.from("banners").delete().eq("id", _req.params.id);
  return res.json({ message: "Banner deletado" });
});

export default router;
