
-- Followers table
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.followers FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'monthly',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(subscriber_id, creator_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (subscriber_id = auth.uid() OR creator_id = auth.uid());
CREATE POLICY "Users can subscribe" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (subscriber_id = auth.uid());
CREATE POLICY "Users can cancel subscription" ON public.subscriptions FOR DELETE TO authenticated USING (subscriber_id = auth.uid());

-- Gifts/tips table
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  post_id UUID REFERENCES public.posts(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gifts" ON public.gifts FOR SELECT TO authenticated USING (sender_id = auth.uid() OR creator_id = auth.uid());
CREATE POLICY "Users can send gifts" ON public.gifts FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- PPV purchases table
CREATE TABLE public.ppv_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, post_id)
);

ALTER TABLE public.ppv_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases" ON public.ppv_purchases FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "Users can buy ppv" ON public.ppv_purchases FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());

-- Function to increment follower count
CREATE OR REPLACE FUNCTION public.handle_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.creator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.creator_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow();

-- Function to increment subscriber count
CREATE OR REPLACE FUNCTION public.handle_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET subscribers_count = COALESCE(subscribers_count, 0) + 1 WHERE id = NEW.creator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET subscribers_count = GREATEST(COALESCE(subscribers_count, 0) - 1, 0) WHERE id = OLD.creator_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_subscription();
