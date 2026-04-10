import { Router, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { requireCreator } from "../middleware/adminGuard.js";

const router = Router();

const applySchema = z.object({
  full_name: z.string().min(2),
  cpf: z.string().min(11).max(14),
  phone: z.string().min(10),
  selfie_url: z.string().url(),
  document_front_url: z.string().url(),
  document_back_url: z.string().url(),
  avatar_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
});

// GET /api/creators — lista criadores aprovados
router.get("/", async (_req, res) => {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, username, name, bio, avatar_url, cover_url, subscription_price, followers_count, is_verified")
    .eq("is_creator", true)
    .order("followers_count", { ascending: false })
    .limit(50);

  return res.json(data ?? []);
});

// POST /api/creators/apply — solicitar ser criador
router.post("/apply", requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = applySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  // Verifica se já tem candidatura pendente
  const { data: existing } = await supabaseAdmin
    .from("creator_applications")
    .select("id, status")
    .eq("user_id", req.user!.id)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: `Já existe uma candidatura com status: ${existing.status}` });
  }

  const { data, error } = await supabaseAdmin
    .from("creator_applications")
    .insert({ ...parse.data, user_id: req.user!.id, status: "pending" })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// GET /api/creators/application — status da candidatura do usuário logado
router.get("/application", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data } = await supabaseAdmin
    .from("creator_applications")
    .select("*")
    .eq("user_id", req.user!.id)
    .maybeSingle();

  if (!data) return res.status(404).json({ error: "Nenhuma candidatura encontrada" });
  return res.json(data);
});

// GET /api/creators/dashboard — estatísticas do criador
router.get("/dashboard", requireAuth, requireCreator, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [postsRes, subsRes, followersRes, earningsRes] = await Promise.all([
    supabaseAdmin.from("posts").select("id", { count: "exact" }).eq("user_id", userId),
    supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact" })
      .eq("creator_id", userId)
      .gte("expires_at", new Date().toISOString()),
    supabaseAdmin.from("followers").select("id", { count: "exact" }).eq("following_id", userId),
    supabaseAdmin.from("subscriptions").select("amount").eq("creator_id", userId),
  ]);

  const totalEarnings = (earningsRes.data ?? []).reduce((sum, s) => sum + (s.amount ?? 0), 0);

  return res.json({
    posts: postsRes.count ?? 0,
    subscribers: subsRes.count ?? 0,
    followers: followersRes.count ?? 0,
    total_earnings: totalEarnings,
  });
});

export default router;
