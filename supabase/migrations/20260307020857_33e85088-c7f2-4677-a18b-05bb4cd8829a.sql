
-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  from_user_id UUID,
  post_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- System can insert via triggers (SECURITY DEFINER)
-- Trigger: new follower notification
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _name TEXT;
BEGIN
  SELECT name INTO _name FROM profiles WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, type, title, message, from_user_id)
  VALUES (NEW.creator_id, 'follower', 'Novo seguidor', COALESCE(_name, 'Alguém') || ' começou a seguir você', NEW.follower_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.followers
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Trigger: new subscriber notification
CREATE OR REPLACE FUNCTION public.notify_new_subscriber()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _name TEXT;
BEGIN
  SELECT name INTO _name FROM profiles WHERE id = NEW.subscriber_id;
  INSERT INTO notifications (user_id, type, title, message, from_user_id)
  VALUES (NEW.creator_id, 'subscriber', 'Novo assinante', COALESCE(_name, 'Alguém') || ' assinou seu conteúdo', NEW.subscriber_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_subscriber
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_subscriber();

-- Trigger: new gift notification
CREATE OR REPLACE FUNCTION public.notify_new_gift()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _name TEXT;
BEGIN
  SELECT name INTO _name FROM profiles WHERE id = NEW.sender_id;
  INSERT INTO notifications (user_id, type, title, message, from_user_id, post_id)
  VALUES (NEW.creator_id, 'gift', 'Novo presente', COALESCE(_name, 'Alguém') || ' enviou R$' || NEW.amount::TEXT, NEW.sender_id, NEW.post_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_gift
  AFTER INSERT ON public.gifts
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_gift();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
