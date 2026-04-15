-- ============================================================
-- Mercado Pago integration tables + helpers
-- ============================================================

-- payment_gateways table (idempotent — may already exist from manual creation)
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway     text UNIQUE NOT NULL,
  enabled     boolean NOT NULL DEFAULT false,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Seed rows so upsert from admin works without errors
INSERT INTO public.payment_gateways (gateway, enabled, credentials)
VALUES
  ('appmax',       false, '{}'::jsonb),
  ('mercadopago',  false, '{}'::jsonb)
ON CONFLICT (gateway) DO NOTHING;

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin rw payment_gateways" ON public.payment_gateways;
CREATE POLICY "admin rw payment_gateways" ON public.payment_gateways
  USING (true) WITH CHECK (true);

-- ── appmax_orders (idempotent) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appmax_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  appmax_order_id     bigint,
  appmax_customer_id  bigint,
  product_type        text,
  product_id          text,
  plan                text,
  amount              numeric,
  payment_type        text,
  status              text DEFAULT 'pending',
  paid_at             timestamptz,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE public.appmax_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner rw appmax_orders" ON public.appmax_orders;
CREATE POLICY "owner rw appmax_orders" ON public.appmax_orders
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── mp_orders ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mp_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  mp_payment_id    text,           -- Mercado Pago payment ID
  external_reference text,        -- same as mp_payment_id for lookup in webhook
  product_type     text,           -- 'subscription' | 'ppv' | 'gift'
  product_id       text,
  plan             text,           -- 'monthly' | 'yearly'
  amount           numeric,
  payment_type     text,           -- 'pix' | 'credit_card'
  status           text DEFAULT 'pending',
  paid_at          timestamptz,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.mp_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner rw mp_orders" ON public.mp_orders;
CREATE POLICY "owner rw mp_orders" ON public.mp_orders
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── SECURITY DEFINER RPC: safely expose only public_key to frontend ─────────
-- The frontend calls this to decide which gateway is active and get the MP
-- public key for client-side tokenization — without ever seeing access_token.
CREATE OR REPLACE FUNCTION public.get_active_gateway_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mp_row  public.payment_gateways%ROWTYPE;
  am_row  public.payment_gateways%ROWTYPE;
BEGIN
  SELECT * INTO mp_row FROM public.payment_gateways WHERE gateway = 'mercadopago' LIMIT 1;
  SELECT * INTO am_row FROM public.payment_gateways WHERE gateway = 'appmax'       LIMIT 1;

  IF mp_row.enabled THEN
    RETURN jsonb_build_object(
      'gateway',    'mercadopago',
      'public_key', COALESCE(mp_row.credentials->>'public_key', '')
    );
  ELSIF am_row.enabled THEN
    RETURN jsonb_build_object('gateway', 'appmax', 'public_key', '');
  ELSE
    RETURN jsonb_build_object('gateway', 'none', 'public_key', '');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_gateway_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_gateway_config() TO anon;
