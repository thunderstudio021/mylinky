-- ============================================================
-- Allow subscriber to UPDATE their own subscription row.
-- This is needed for the UPSERT (INSERT ON CONFLICT DO UPDATE)
-- to work when renewing or reactivating a subscription via
-- the frontend. The webhook (service role) bypasses RLS.
-- ============================================================

-- Drop any existing UPDATE policy to avoid conflicts
DROP POLICY IF EXISTS "subscriber can update own subscription"   ON public.subscriptions;
DROP POLICY IF EXISTS "subscriber update own subscription"       ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions"       ON public.subscriptions;

CREATE POLICY "subscriber update own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING     (subscriber_id = auth.uid())
  WITH CHECK (subscriber_id = auth.uid());
