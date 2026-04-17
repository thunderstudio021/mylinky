import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APPMAX_SBX_AUTH    = "https://auth.sandboxappmax.com.br";
const APPMAX_PROD_AUTH   = "https://auth.appmax.com.br";
const APPMAX_SBX_API     = "https://api.sandboxappmax.com.br";
const APPMAX_PROD_API    = "https://api.appmax.com.br";
const APPMAX_SBX_BROWSER = "https://breakingcode.sandboxappmax.com.br/appstore/integration";
const APPMAX_PROD_BROWSER = "https://admin.appmax.com.br/appstore/integration";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAppToken(clientId: string, clientSecret: string, isSandbox: boolean): Promise<string> {
  const base = isSandbox ? APPMAX_SBX_AUTH : APPMAX_PROD_AUTH;
  const res = await fetch(`${base}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.message || data.error || "Não foi possível obter App Token AppMax");
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const action: string = body.action;

    const { data: gwRow } = await supabaseAdmin.from("payment_gateways").select("credentials").eq("gateway", "appmax").single();
    const creds = gwRow?.credentials ?? {};
    const isSandbox: boolean = creds.is_sandbox ?? false;
    const apiBase = isSandbox ? APPMAX_SBX_API : APPMAX_PROD_API;
    const browserBase = isSandbox ? APPMAX_SBX_BROWSER : APPMAX_PROD_BROWSER;

    // ── Step 1+2: Get App Token then Authorize Installation ────────────────────
    if (action === "authorize") {
      if (!creds.client_id || !creds.client_secret || !creds.app_id) {
        return new Response(JSON.stringify({ error: "Client ID, Client Secret e App UUID são obrigatórios" }), { status: 400, headers: corsHeaders });
      }

      const appToken = await getAppToken(creds.client_id, creds.client_secret, isSandbox);

      const externalKey = `mylinky-${Date.now()}`;
      const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/appmax-webhook`;

      const authorizeRes = await fetch(`${apiBase}/app/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${appToken}` },
        body: JSON.stringify({ app_id: creds.app_id, external_key: externalKey, url_callback: callbackUrl }),
      });
      const authorizeData = await authorizeRes.json();

      if (!authorizeData.data?.token) {
        throw new Error(authorizeData.message || JSON.stringify(authorizeData) || "Erro ao autorizar instalação");
      }

      const hash = authorizeData.data.token;

      await supabaseAdmin.from("payment_gateways").update({
        credentials: { ...creds, app_token: appToken, install_hash: hash, external_key: externalKey, installation_complete: false },
      }).eq("gateway", "appmax");

      return new Response(JSON.stringify({
        ok: true,
        hash,
        external_key: externalKey,
        browser_url: `${browserBase}/${hash}`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Step 4: Generate Merchant Credentials ─────────────────────────────────
    if (action === "generate") {
      if (!creds.install_hash) {
        return new Response(JSON.stringify({ error: "Hash de instalação não encontrado. Execute o passo de autorização primeiro." }), { status: 400, headers: corsHeaders });
      }

      const appToken = await getAppToken(creds.client_id, creds.client_secret, isSandbox);

      const generateRes = await fetch(`${apiBase}/app/client/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${appToken}` },
        body: JSON.stringify({ token: creds.install_hash }),
      });
      const generateData = await generateRes.json();

      if (!generateData.data?.client?.client_id) {
        throw new Error(generateData.message || JSON.stringify(generateData) || "Erro ao gerar credenciais do merchant");
      }

      const merchantClientId = generateData.data.client.client_id;
      const merchantClientSecret = generateData.data.client.client_secret;

      await supabaseAdmin.from("payment_gateways").update({
        credentials: { ...creds, merchant_client_id: merchantClientId, merchant_client_secret: merchantClientSecret, installation_complete: true },
      }).eq("gateway", "appmax");

      return new Response(JSON.stringify({ ok: true, merchant_client_id: merchantClientId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inválida" }), { status: 400, headers: corsHeaders });

  } catch (err) {
    console.error("[appmax-install]", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
