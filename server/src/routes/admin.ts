import { Router, Response } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminGuard.js";

const router = Router();

// Todas as rotas aqui exigem autenticação + papel admin
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard
router.get("/dashboard", async (_req, res) => {
  const [usersRes, creatorsRes, postsRes, subsRes, pendingRes, withdrawalsRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact" }).limit(1),
    supabaseAdmin.from("profiles").select("id", { count: "exact" }).eq("is_creator", true).limit(1),
    supabaseAdmin.from("posts").select("id", { count: "exact" }).limit(1),
    supabaseAdmin.from("subscriptions").select("id", { count: "exact" }).limit(1),
    supabaseAdmin
      .from("creator_applications")
      .select("id", { count: "exact" })
      .eq("status", "pending")
      .limit(1),
    supabaseAdmin
      .from("withdrawal_requests")
      .select("id", { count: "exact" })
      .eq("status", "pending")
      .limit(1),
  ]);

  return res.json({
    total_users: usersRes.count ?? 0,
    total_creators: creatorsRes.count ?? 0,
    total_posts: postsRes.count ?? 0,
    total_subscriptions: subsRes.count ?? 0,
    pending_applications: pendingRes.count ?? 0,
    pending_withdrawals: withdrawalsRes.count ?? 0,
  });
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  const page = parseInt(req.query.page as string ?? "1");
  const limit = Math.min(parseInt(req.query.limit as string ?? "50"), 100);
  const from = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  let query = supabaseAdmin
    .from("profiles")
    .select("*, user_roles(role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (search) {
    query = query.or(`username.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ users: data, total: count, page, limit });
});

// PUT /api/admin/users/:id — editar usuário
router.put("/users/:id", async (req: AuthRequest, res: Response) => {
  const allowed = ["name", "bio", "is_creator", "is_verified", "subscription_price"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// POST /api/admin/users/:id/ban
router.post("/users/:id/ban", async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
    ban_duration: "876600h", // ~100 anos
  });
  if (error) return res.status(400).json({ error: error.message });

  // Opcional: registrar motivo
  if (reason) {
    await supabaseAdmin
      .from("profiles")
      .update({ bio: `[BANIDO: ${reason}]` })
      .eq("id", req.params.id);
  }

  return res.json({ message: "Usuário banido" });
});

// POST /api/admin/users/:id/unban
router.post("/users/:id/unban", async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
    ban_duration: "none",
  });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: "Usuário desbanido" });
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: "Usuário deletado" });
});

// GET /api/admin/applications — candidaturas a criador
router.get("/applications", async (req, res) => {
  const status = req.query.status as string ?? "pending";

  const { data } = await supabaseAdmin
    .from("creator_applications")
    .select("*, profiles(id, username, name, email)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  return res.json(data ?? []);
});

// POST /api/admin/applications/:id/approve
router.post("/applications/:id/approve", async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.rpc("approve_creator", {
    application_id: req.params.id,
  });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: "Criador aprovado" });
});

// POST /api/admin/applications/:id/reject
router.post("/applications/:id/reject", async (req: AuthRequest, res: Response) => {
  const { admin_notes } = req.body;
  const { error } = await supabaseAdmin.rpc("reject_creator", {
    application_id: req.params.id,
  });
  if (error) return res.status(400).json({ error: error.message });

  if (admin_notes) {
    await supabaseAdmin
      .from("creator_applications")
      .update({ admin_notes })
      .eq("id", req.params.id);
  }

  return res.json({ message: "Candidatura rejeitada" });
});

// GET /api/admin/withdrawals
router.get("/withdrawals", async (req, res) => {
  const status = req.query.status as string ?? "pending";

  const { data } = await supabaseAdmin
    .from("withdrawal_requests")
    .select("*, profiles(id, username, name)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  return res.json(data ?? []);
});

// PUT /api/admin/withdrawals/:id — aprovar ou rejeitar saque
router.put("/withdrawals/:id", async (req: AuthRequest, res: Response) => {
  const { status, admin_notes } = req.body;
  if (!["approved", "rejected", "paid"].includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }

  const { data, error } = await supabaseAdmin
    .from("withdrawal_requests")
    .update({ status, admin_notes, reviewed_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

export default router;
