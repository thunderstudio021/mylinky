import { Router, Response } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string ?? "1");
  const limit = Math.min(parseInt(req.query.limit as string ?? "30"), 50);
  const from = (page - 1) * limit;

  const { data, count } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  return res.json({ notifications: data ?? [], total: count, page, limit });
});

// PUT /api/notifications/:id/read
router.put("/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("id", req.params.id)
    .eq("user_id", req.user!.id);

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: "Notificação marcada como lida" });
});

// PUT /api/notifications/read-all
router.put("/read-all", requireAuth, async (req: AuthRequest, res: Response) => {
  await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("user_id", req.user!.id)
    .eq("read", false);

  return res.json({ message: "Todas notificações marcadas como lidas" });
});

// DELETE /api/notifications/:id
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user!.id);

  return res.json({ message: "Notificação removida" });
});

export default router;
