
-- Likes table
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (user_id = auth.uid());

-- Comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (user_id = auth.uid());

-- Add comments_enabled to posts (default true)
ALTER TABLE public.posts ADD COLUMN comments_enabled boolean NOT NULL DEFAULT true;

-- Trigger to update likes_count
CREATE OR REPLACE FUNCTION public.handle_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_like_change AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like();

-- Trigger to update comments_count
CREATE OR REPLACE FUNCTION public.handle_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_comment_change AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment();
