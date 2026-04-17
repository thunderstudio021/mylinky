import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    console.log("[appmax-webhook] received:", JSON.stringify(body));

    const {
      app_id,
      external_key,
      client_id: merchantClientId,
      client_secret: merchantClientSecret,
    } = body;

    const { data: gwRow } = await supabaseAdmin.from("payment_gateways")
      .select("*").eq("gateway", "appmax").single();

    if (!gwRow) {
      return new Response(JSON.stringify({ error: "Gateway not found" }), { status: 404, headers: corsHeaders });
    }

    const creds = gwRow.credentials ?? {};
    const externalId = creds.external_id || crypto.randomUUID();

    await supabaseAdmin.from("payment_gateways").update({
      credentials: {
        ...creds,
        merchant_client_id: merchantClientId,
        merchant_client_secret: merchantClientSecret,
        app_id_numeric: app_id,
        installation_complete: true,
        external_id: externalId,
      },
    }).eq("gateway", "appmax");

    return new Response(JSON.stringify({ external_id: externalId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[appmax-webhook]", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
