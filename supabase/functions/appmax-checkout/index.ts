import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APPMAX_PROD_BASE    = "https://admin.appmax.com.br/api/v3";
const APPMAX_SANDBOX_BASE = "https://breakingcode.sandboxappmax.com.br/api/v3";
const APPMAX_PROD_OAUTH   = "https://auth.appmax.com.br";
const APPMAX_SBX_OAUTH    = "https://auth.sandboxappmax.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Token management ──────────────────────────────────────────────────────────
async function refreshAppmaxToken(clientId: string, clientSecret: string, isSandbox: boolean, supabaseAdmin: any): Promise<string> {
  const base = isSandbox ? APPMAX_SBX_OAUTH : APPMAX_PROD_OAUTH;
  const res = await fetch(`${base}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.message || data.error || "Não foi possível gerar token AppMax");
  const expiresIn = data.expires_in ?? 3600;
  const { data: gwRow } = await supabaseAdmin.from("payment_gateways").select("credentials").eq("gateway", "appmax").single();
  await supabaseAdmin.from("payment_gateways").update({
    credentials: { ...(gwRow?.credentials ?? {}), api_key: data.access_token, token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString() },
  }).eq("gateway", "appmax");
  return data.access_token;
}

async function getValidToken(creds: any, isSandbox: boolean, supabaseAdmin: any): Promise<string> {
  const clientId = creds.merchant_client_id || creds.client_id;
  const clientSecret = creds.merchant_client_secret || creds.client_secret;
  let token: string = creds.api_key ?? "";
  const expiresAt: string = creds.token_expires_at ?? "";
  const isExpired = !token || (expiresAt && new Date(expiresAt) <= new Date(Date.now() + 60_000));
  if (isExpired && clientId && clientSecret) {
    token = await refreshAppmaxToken(clientId, clientSecret, isSandbox, supabaseAdmin);
  }
  return token;
}

// ── AppMax API helpers ────────────────────────────────────────────────────────
async function appmaxPost(path: string, body: Record<string, unknown>, token: string, isSandbox: boolean): Promise<any> {
  const base = isSandbox ? APPMAX_SANDBOX_BASE : APPMAX_PROD_BASE;
  const res = await fetch(`${base}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, "access-token": token }),
  });
  const json = await res.json();
  if (!json.success) {
    const err = new Error(json.text || `AppMax error on ${path}`);
    (err as any).appmaxResponse = json;
    throw err;
  }
  return json.data;
}

async function appmaxGet(path: string, token: string, isSandbox: boolean): Promise<any> {
  const base = isSandbox ? APPMAX_SANDBOX_BASE : APPMAX_PROD_BASE;
  const res = await fetch(`${base}/${path}?access-token=${encodeURIComponent(token)}`);
  const json = await res.json();
  return json;
}

// ── Activate subscription/PPV/gift after confirmed payment ───────────────────
async function activateOrder(order: any, supabaseAdmin: any): Promise<void> {
  if (order.product_type === "subscription") {
    const plan = order.plan || "monthly";
    const expiresAt = new Date();
    if (plan === "yearly") { expiresAt.setFullYear(expiresAt.getFullYear() + 1); }
    else { expiresAt.setMonth(expiresAt.getMonth() + 1); }
    await supabaseAdmin.from("subscriptions").upsert({
      subscriber_id: order.user_id, creator_id: order.creator_id,
      plan, amount: Number(order.amount),
      payment_method: order.payment_type === "pix" ? "pix" : "credit_card",
      status: "active", expires_at: expiresAt.toISOString(),
    }, { onConflict: "subscriber_id,creator_id" });
    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id, type: "subscription",
      title: "Assinatura ativada!",
      message: `Sua assinatura foi ativada. Acesso válido até ${expiresAt.toLocaleDateString("pt-BR")}.`,
      read: false,
    });
  } else if (order.product_type === "ppv") {
    await supabaseAdmin.from("ppv_purchases").insert({
      buyer_id: order.user_id, post_id: order.product_id,
      amount: Number(order.amount),
      payment_method: order.payment_type === "pix" ? "pix" : "credit_card",
    });
  } else if (order.product_type === "gift") {
    await supabaseAdmin.from("gifts").insert({
      sender_id: order.user_id, creator_id: order.creator_id,
      amount: Number(order.amount), payment_method: "pix",
    }).then(() => {});
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const action: string = body.action || "checkout";

    // ── Load credentials ─────────────────────────────────────────────────────
    const { data: gwRow } = await supabaseAdmin.from("payment_gateways").select("enabled, credentials").eq("gateway", "appmax").single();
    const creds = gwRow?.credentials ?? {};
    const isSandbox: boolean = creds.is_sandbox ?? false;

    // ── ACTION: generate_token ────────────────────────────────────────────────
    if (action === "generate_token") {
      if (!creds.client_id || !creds.client_secret) {
        return new Response(JSON.stringify({ error: "Client ID e Client Secret não configurados" }), { status: 400, headers: corsHeaders });
      }
      const token = await refreshAppmaxToken(creds.client_id, creds.client_secret, isSandbox, supabaseAdmin);
      return new Response(JSON.stringify({ ok: true, access_token: token }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: check_payment ─────────────────────────────────────────────────
    if (action === "check_payment") {
      const { order_id } = body;
      if (!order_id) return new Response(JSON.stringify({ error: "order_id obrigatório" }), { status: 400, headers: corsHeaders });

      const token = await getValidToken(creds, isSandbox, supabaseAdmin);
      if (!token) return new Response(JSON.stringify({ ok: true, paid: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      let isPaid = false;
      try {
        const orderData = await appmaxGet(`order/${order_id}`, token, isSandbox);
        const status = (orderData?.data?.status || orderData?.status || "").toLowerCase();
        isPaid = ["paid", "approved", "complete", "completed", "pago", "aprovado"].includes(status);
        console.log("[check_payment] order", order_id, "status:", status, "isPaid:", isPaid);
      } catch (e) {
        console.log("[check_payment] GET order failed:", e);
      }

      if (!isPaid) return new Response(JSON.stringify({ ok: true, paid: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: pendingOrder } = await supabaseAdmin.from("appmax_orders")
        .select("*").eq("appmax_order_id", order_id).eq("user_id", user.id).eq("status", "pending").single();

      if (!pendingOrder) {
        return new Response(JSON.stringify({ ok: true, paid: true, activated: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabaseAdmin.from("appmax_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", pendingOrder.id);
      await activateOrder(pendingOrder, supabaseAdmin);

      return new Response(JSON.stringify({ ok: true, paid: true, activated: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: checkout (default) ────────────────────────────────────────────
    if (!gwRow?.enabled) {
      return new Response(JSON.stringify({ error: "AppMax não está ativo" }), { status: 400, headers: corsHeaders });
    }

    let token = await getValidToken(creds, isSandbox, supabaseAdmin);
    if (!token) {
      return new Response(JSON.stringify({ error: "Token AppMax não configurado. Acesse Admin → Pagamentos → AppMax." }), { status: 400, headers: corsHeaders });
    }

    const { payment_type, amount, product_type, product_id, creator_id, cpf, card, plan } = body;

    const { data: profile } = await supabase.from("profiles").select("name, email, whatsapp, cpf").eq("id", user.id).single();
    const firstName = (profile?.name || "Usuario").split(" ")[0];
    const lastName  = (profile?.name || "Usuario").split(" ").slice(1).join(" ") || "Sobrenome";
    const email     = profile?.email || user.email || "sem@email.com";
    const telephone = (profile?.whatsapp || "00000000000").replace(/\D/g, "").slice(0, 11).padEnd(11, "0");
    const documentNumber = (cpf || profile?.cpf || "").replace(/\D/g, "").slice(0, 11);

    if (documentNumber.length !== 11) {
      return new Response(JSON.stringify({ error: "CPF inválido" }), { status: 400, headers: corsHeaders });
    }

    async function postWithRetry(path: string, postBody: Record<string, unknown>): Promise<any> {
      try {
        return await appmaxPost(path, postBody, token, isSandbox);
      } catch (err: any) {
        const resp = err.appmaxResponse;
        const isAuth = resp && (resp.code === 401 || resp.code === 403 || /token|autoriza/i.test(resp.text ?? ""));
        if (isAuth && creds.client_id && creds.client_secret) {
          token = await refreshAppmaxToken(creds.client_id, creds.client_secret, isSandbox, supabaseAdmin);
          return await appmaxPost(path, postBody, token, isSandbox);
        }
        throw err;
      }
    }

    const customer = await postWithRetry("customer", { firstname: firstName, lastname: lastName, email, telephone, ip: req.headers.get("x-forwarded-for") || "127.0.0.1" });
    const customerId = customer.id as number;

    const productLabel = product_type === "subscription"
      ? (plan === "yearly" ? "Assinatura Anual" : "Assinatura Mensal")
      : product_type === "gift" ? "Presente" : "Conteúdo PPV";

    const order = await postWithRetry("order", {
      customer_id: customerId,
      total: Number(amount.toFixed(2)),
      products: [{ sku: `${product_type}-${product_id}`, name: productLabel, qty: 1, price: Number(amount.toFixed(2)), digital_product: true }],
    });
    const orderId = order.id as number;

    let payment: any;
    if (payment_type === "pix") {
      const expDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      payment = await postWithRetry("payment/pix", {
        cart: { order_id: orderId }, customer: { customer_id: customerId },
        payment: { pix: { document_number: documentNumber, expiration_date: expDate } },
      });
    } else {
      if (!card) throw new Error("Dados do cartão não informados");
      payment = await postWithRetry("payment/credit-card", {
        cart: { order_id: orderId }, customer: { customer_id: customerId },
        payment: { CreditCard: { document_number: documentNumber, installments: card.installments || 1, number: card.number.replace(/\s/g, ""), cvv: card.cvv, month: card.month, year: card.year, name: card.holder, soft_descriptor: "MYLINKY" } },
      });
    }

    await supabaseAdmin.from("appmax_orders").insert({
      user_id: user.id, creator_id, appmax_order_id: orderId, appmax_customer_id: customerId,
      product_type, product_id, plan: plan || null, amount, payment_type, status: "pending",
    });

    const isApproved = payment_type === "credit_card" && !!payment.pay_reference;
    return new Response(JSON.stringify({
      ok: true, order_id: orderId, payment_type,
      pix: payment_type === "pix" ? { qrcode: payment.pix_qrcode ?? "", emv: payment.pix_emv ?? "", expiration: payment.pix_expiration_date ?? "" } : null,
      credit_card: payment_type === "credit_card" ? { status: isApproved ? "approved" : "pending", approved: isApproved, pay_reference: payment.pay_reference ?? "" } : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[appmax-checkout]", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
