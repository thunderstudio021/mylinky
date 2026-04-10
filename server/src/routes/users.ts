import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/).optional(),
  avatar_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
  subscription_price: z.number().min(0).optional(),
});

// GET /api/users/:username
router.get("/:username", optionalAuth, async (req: AuthRequest, res: Response) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("username", req.params.username)
    .maybeSingle();

  if (!profile) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.json(profile);
});

// PUT /api/users/profile
router.put("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const updates = parse.data;

  if (updates.username) {
    const { data: conflict } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", updates.username)
      .neq("id", req.user!.id)
      .maybeSingle();
    if (conflict) return res.status(409).json({ error: "Username já em uso" });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", req.user!.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// GET /api/users/:username/posts
router.get("/:username/posts", optionalAuth, async (req: AuthRequest, res: Response) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", req.params.username)
    .maybeSingle();

  if (!profile) return res.status(404).json({ error: "Usuário não encontrado" });

  const page = parseInt(req.query.page as string ?? "1");
  const limit = Math.min(parseInt(req.query.limit as string ?? "20"), 50);
  const from = (page - 1) * limit;

  let query = supabaseAdmin
    .from("posts")
    .select("*", { count: "exact" })
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  // Se não for o próprio criador, filtra apenas posts públicos
  if (req.user?.id !== profile.id) {
    query = query.eq("visibility", "free");
  }

  const { data, error, count } = await query;
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ posts: data, total: count, page, limit });
});

// POST /api/users/:username/follow
router.post("/:username/follow", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", req.params.username)
    .maybeSingle();

  if (!target) return res.status(404).json({ error: "Usuário não encontrado" });
  if (target.id === req.user!.id) return res.status(400).json({ error: "Não pode seguir a si mesmo" });

  const { error } = await supabaseAdmin
    .from("followers")
    .insert({ follower_id: req.user!.id, following_id: target.id });

  if (error?.code === "23505") return res.status(409).json({ error: "Já segue este usuário" });
  if (error) return res.status(400).json({ error: error.message });

  return res.status(201).json({ message: "Seguindo" });
});

// DELETE /api/users/:username/follow
router.delete("/:username/follow", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", req.params.username)
    .maybeSingle();

  if (!target) return res.status(404).json({ error: "Usuário não encontrado" });

  await supabaseAdmin
    .from("followers")
    .delete()
    .eq("follower_id", req.user!.id)
    .eq("following_id", target.id);

  return res.json({ message: "Deixou de seguir" });
});

// GET /api/users/:username/followers
router.get("/:username/followers", async (req: Request, res: Response) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", req.params.username)
    .maybeSingle();

  if (!profile) return res.status(404).json({ error: "Usuário não encontrado" });

  const { data } = await supabaseAdmin
    .from("followers")
    .select("follower_id, profiles!followers_follower_id_fkey(id, username, name, avatar_url)")
    .eq("following_id", profile.id);

  return res.json(data ?? []);
});

// GET /api/users/:username/following
router.get("/:username/following", async (req: Request, res: Response) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", req.params.username)
    .maybeSingle();

  if (!profile) return res.status(404).json({ error: "Usuário não encontrado" });

  const { data } = await supabaseAdmin
    .from("followers")
    .select("following_id, profiles!followers_following_id_fkey(id, username, name, avatar_url)")
    .eq("follower_id", profile.id);

  return res.json(data ?? []);
});

export default router;
