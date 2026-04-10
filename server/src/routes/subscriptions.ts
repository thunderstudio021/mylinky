import { Router, Response } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/subscriptions — assinaturas ativas do usuário logado
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("*, profiles!subscriptions_creator_id_fkey(id, username, name, avatar_url)")
    .eq("subscriber_id", req.user!.id)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return res.json(data ?? []);
});

// GET /api/subscriptions/subscribers — assinantes do criador logado
router.get("/subscribers", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("*, profiles!subscriptions_subscriber_id_fkey(id, username, name, avatar_url)")
    .eq("creator_id", req.user!.id)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return res.json(data ?? []);
});

// POST /api/subscriptions — criar/renovar assinatura (pós-confirmação de pagamento)
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { creator_id, plan, amount } = req.body;

  if (!creator_id || !plan || amount == null) {
    return res.status(400).json({ error: "creator_id, plan e amount são obrigatórios" });
  }

  const validPlans = ["monthly", "yearly"];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: "Plano inválido. Use: monthly ou yearly" });
  }

  const { data: creator } = await supabaseAdmin
    .from("profiles")
    .select("id, is_creator")
    .eq("id", creator_id)
    .maybeSingle();

  if (!creator?.is_creator) return res.status(404).json({ error: "Criador não encontrado" });
  if (creator_id === req.user!.id) return res.status(400).json({ error: "Não pode assinar a si mesmo" });

  const expiresAt = new Date();
  if (plan === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
  else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Upsert: renova se já existir
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        subscriber_id: req.user!.id,
        creator_id,
        plan,
        amount,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "subscriber_id,creator_id" }
    )
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// DELETE /api/subscriptions/:id — cancelar assinatura
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("subscriber_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (!sub) return res.status(404).json({ error: "Assinatura não encontrada" });
  if (sub.subscriber_id !== req.user!.id) return res.status(403).json({ error: "Sem permissão" });

  await supabaseAdmin.from("subscriptions").delete().eq("id", req.params.id);
  return res.json({ message: "Assinatura cancelada" });
});

export default router;
