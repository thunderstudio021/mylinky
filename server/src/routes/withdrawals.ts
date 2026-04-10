import { Router, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { requireCreator } from "../middleware/adminGuard.js";

const router = Router();

const requestSchema = z.object({
  amount: z.number().min(10, "Valor mínimo de saque: R$10"),
  pix_key: z.string().min(3),
  pix_key_type: z.enum(["cpf", "cnpj", "email", "phone", "random"]),
});

// GET /api/withdrawals — histórico de saques do criador
router.get("/", requireAuth, requireCreator, async (req: AuthRequest, res: Response) => {
  const { data } = await supabaseAdmin
    .from("withdrawal_requests")
    .select("*")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false });

  return res.json(data ?? []);
});

// POST /api/withdrawals — solicitar saque
router.post("/", requireAuth, requireCreator, async (req: AuthRequest, res: Response) => {
  const parse = requestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { amount, pix_key, pix_key_type } = parse.data;

  // Verifica saque pendente
  const { data: pending } = await supabaseAdmin
    .from("withdrawal_requests")
    .select("id")
    .eq("user_id", req.user!.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) {
    return res.status(409).json({ error: "Já existe um saque pendente" });
  }

  const { data, error } = await supabaseAdmin
    .from("withdrawal_requests")
    .insert({
      user_id: req.user!.id,
      amount,
      pix_key,
      pix_key_type,
      status: "pending",
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

export default router;
