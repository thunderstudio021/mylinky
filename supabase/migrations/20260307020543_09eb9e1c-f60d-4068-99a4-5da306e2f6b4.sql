
-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can read own withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators can request withdrawal" ON public.withdrawal_requests
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
