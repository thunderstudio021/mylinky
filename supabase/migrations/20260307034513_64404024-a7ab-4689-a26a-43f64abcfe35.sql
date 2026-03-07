
-- Allow admins to read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all gifts
CREATE POLICY "Admins can read all gifts"
ON public.gifts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all ppv_purchases
CREATE POLICY "Admins can read all ppv_purchases"
ON public.ppv_purchases FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
