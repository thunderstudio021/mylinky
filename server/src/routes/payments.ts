import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// -----------------------------------------------------------
// INTEGRAÇÃO DE PAGAMENTOS
//
// Para produção, substitua os blocos marcados com TODO pelo
// SDK do seu gateway: Stripe, Pagar.me, Mercado Pago, etc.
// Os endpoints já retornam a estrutura esperada pelo frontend.
// -----------------------------------------------------------

const subscribeSchema = z.object({
  creator_id: z.string().uuid(),
  plan: z.enum(["monthly", "yearly"]),
  payment_method: z.enum(["pix", "credit_card"]),
});

const ppvSchema = z.object({
  post_id: z.string().uuid(),
  payment_method: z.enum(["pix", "credit_card"]),
});

const giftSchema = z.object({
  creator_id: z.string().uuid(),
  amount: z.number().min(1),
  message: z.string().max(200).optional(),
  payment_method: z.enum(["pix", "credit_card"]),
});

// POST /api/payments/subscribe — inicia pagamento de assinatura
router.post("/subscribe", requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = subscribeSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { creator_id, plan, payment_method } = parse.data;

  const { data: creator } = await supabaseAdmin
    .from("profiles")
    .select("id, name, subscription_price")
    .eq("id", creator_id)
    .maybeSingle();

  if (!creator) return res.status(404).json({ error: "Criador não encontrado" });

  const amount = plan === "yearly"
    ? (creator.subscription_price ?? 0) * 12 * 0.8  // 20% desconto anual
    : (creator.subscription_price ?? 0);

  // TODO: criar cobrança no gateway de pagamento
  // Exemplo com Pagar.me:
  // const charge = await pagarme.charges.create({ amount, payment_method, ... });
  // Exemplo com Stripe:
  // const session = await stripe.checkout.sessions.create({ ... });

  // Retorna dados para o frontend processar o pagamento
  return res.json({
    payment_id: `pay_${Date.now()}`, // TODO: retornar ID real do gateway
    amount,
    currency: "BRL",
    payment_method,
    plan,
    creator_id,
    // pix_qrcode: charge.pix_qr_code,   // descomentar ao integrar PIX
    // checkout_url: session.url,          // descomentar ao integrar Stripe
    status: "pending",
  });
});

// POST /api/payments/ppv — inicia pagamento de conteúdo PPV
router.post("/ppv", requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = ppvSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { post_id, payment_method } = parse.data;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("id, user_id, price, visibility")
    .eq("id", post_id)
    .maybeSingle();

  if (!post) return res.status(404).json({ error: "Post não encontrado" });
  if (post.visibility !== "ppv") return res.status(400).json({ error: "Post não é PPV" });
  if (post.user_id === req.user!.id) return res.status(400).json({ error: "Você é o dono deste post" });

  // Verifica se já comprou
  const { data: existing } = await supabaseAdmin
    .from("ppv_purchases")
    .select("id")
    .eq("user_id", req.user!.id)
    .eq("post_id", post_id)
    .maybeSingle();

  if (existing) return res.status(409).json({ error: "Conteúdo já adquirido" });

  // TODO: criar cobrança no gateway de pagamento

  return res.json({
    payment_id: `pay_${Date.now()}`,
    amount: post.price ?? 0,
    currency: "BRL",
    payment_method,
    post_id,
    status: "pending",
  });
});

// POST /api/payments/gift — envia presente/gorjeta ao criador
router.post("/gift", requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = giftSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { creator_id, amount, message, payment_method } = parse.data;

  const { data: creator } = await supabaseAdmin
    .from("profiles")
    .select("id, is_creator")
    .eq("id", creator_id)
    .maybeSingle();

  if (!creator?.is_creator) return res.status(404).json({ error: "Criador não encontrado" });

  // TODO: criar cobrança no gateway de pagamento

  return res.json({
    payment_id: `pay_${Date.now()}`,
    amount,
    currency: "BRL",
    payment_method,
    creator_id,
    message,
    status: "pending",
  });
});

// POST /api/payments/webhook — webhook do gateway de pagamento
// Configure esta URL no painel do seu gateway de pagamento
router.post("/webhook", async (req: Request, res: Response) => {
  // TODO: validar assinatura do webhook (HMAC do gateway)
  // const signature = req.headers["x-gateway-signature"];
  // if (!validateSignature(signature, req.body)) return res.status(401).end();

  const { event, data } = req.body;

  if (event === "payment.succeeded") {
    const { payment_id, type, creator_id, post_id, subscriber_id, plan, amount } = data;

    if (type === "subscription") {
      const expiresAt = new Date();
      if (plan === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      else expiresAt.setMonth(expiresAt.getMonth() + 1);

      await supabaseAdmin.from("subscriptions").upsert(
        { subscriber_id, creator_id, plan, amount, expires_at: expiresAt.toISOString() },
        { onConflict: "subscriber_id,creator_id" }
      );
    }

    if (type === "ppv") {
      await supabaseAdmin
        .from("ppv_purchases")
        .insert({ user_id: subscriber_id, post_id, amount });
    }

    if (type === "gift") {
      await supabaseAdmin
        .from("gifts")
        .insert({ sender_id: subscriber_id, receiver_id: creator_id, amount, message: data.message });
    }
  }

  return res.status(200).json({ received: true });
});

export default router;
