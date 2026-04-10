import { Router, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  visibility: z.enum(["free", "subscribers", "ppv"]).default("free"),
  media_url: z.string().url().optional(),
  media_type: z.enum(["photo", "video"]).optional(),
  price: z.number().min(0).optional(),
});

const updatePostSchema = createPostSchema.partial();

// GET /api/posts — feed público
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string ?? "1");
  const limit = Math.min(parseInt(req.query.limit as string ?? "20"), 50);
  const from = (page - 1) * limit;

  const { data, count } = await supabaseAdmin
    .from("posts")
    .select("*, profiles(id, username, name, avatar_url, is_verified)", { count: "exact" })
    .eq("visibility", "free")
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  return res.json({ posts: data ?? [], total: count, page, limit });
});

// POST /api/posts
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = createPostSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({ ...parse.data, user_id: req.user!.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// GET /api/posts/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("*, profiles(id, username, name, avatar_url, is_verified)")
    .eq("id", req.params.id)
    .maybeSingle();

  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  // Checa acesso a posts pagos
  if (post.visibility !== "free" && req.user?.id !== post.user_id) {
    if (post.visibility === "subscribers") {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", req.user?.id ?? "")
        .eq("creator_id", post.user_id)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();
      if (!sub) return res.status(403).json({ error: "Conteúdo exclusivo para assinantes" });
    } else if (post.visibility === "ppv") {
      const { data: purchase } = await supabaseAdmin
        .from("ppv_purchases")
        .select("id")
        .eq("user_id", req.user?.id ?? "")
        .eq("post_id", post.id)
        .maybeSingle();
      if (!purchase) return res.status(403).json({ error: "Conteúdo pago — compre para acessar" });
    }
  }

  return res.json(post);
});

// PUT /api/posts/:id
router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = updatePostSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { data: existing } = await supabaseAdmin
    .from("posts")
    .select("user_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (!existing) return res.status(404).json({ error: "Post não encontrado" });
  if (existing.user_id !== req.user!.id) return res.status(403).json({ error: "Sem permissão" });

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(parse.data)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/posts/:id
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: existing } = await supabaseAdmin
    .from("posts")
    .select("user_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (!existing) return res.status(404).json({ error: "Post não encontrado" });
  if (existing.user_id !== req.user!.id) return res.status(403).json({ error: "Sem permissão" });

  await supabaseAdmin.from("posts").delete().eq("id", req.params.id);
  return res.json({ message: "Post deletado" });
});

// POST /api/posts/:id/like
router.post("/:id/like", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from("likes")
    .insert({ user_id: req.user!.id, post_id: req.params.id });

  if (error?.code === "23505") return res.status(409).json({ error: "Já curtiu este post" });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ message: "Curtido" });
});

// DELETE /api/posts/:id/like
router.delete("/:id/like", requireAuth, async (req: AuthRequest, res: Response) => {
  await supabaseAdmin
    .from("likes")
    .delete()
    .eq("user_id", req.user!.id)
    .eq("post_id", req.params.id);
  return res.json({ message: "Curtida removida" });
});

// GET /api/posts/:id/comments
router.get("/:id/comments", async (req: AuthRequest, res: Response) => {
  const { data } = await supabaseAdmin
    .from("comments")
    .select("*, profiles(id, username, name, avatar_url)")
    .eq("post_id", req.params.id)
    .order("created_at", { ascending: true });

  return res.json(data ?? []);
});

// POST /api/posts/:id/comments
router.post("/:id/comments", requireAuth, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Conteúdo do comentário obrigatório" });

  const { data, error } = await supabaseAdmin
    .from("comments")
    .insert({ post_id: req.params.id, user_id: req.user!.id, content: content.trim() })
    .select("*, profiles(id, username, name, avatar_url)")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// DELETE /api/posts/:id/comments/:commentId
router.delete("/:id/comments/:commentId", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: comment } = await supabaseAdmin
    .from("comments")
    .select("user_id")
    .eq("id", req.params.commentId)
    .maybeSingle();

  if (!comment) return res.status(404).json({ error: "Comentário não encontrado" });
  if (comment.user_id !== req.user!.id) return res.status(403).json({ error: "Sem permissão" });

  await supabaseAdmin.from("comments").delete().eq("id", req.params.commentId);
  return res.json({ message: "Comentário deletado" });
});

export default router;
