
-- Polls table
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Poll options table
CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  votes_count integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls: anyone can read
CREATE POLICY "Anyone can read polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Creators can insert polls" ON public.polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.creator_id = auth.uid())
);

-- Poll options: anyone can read
CREATE POLICY "Anyone can read poll options" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Creators can insert poll options" ON public.poll_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.posts po ON po.id = p.post_id WHERE p.id = poll_id AND po.creator_id = auth.uid())
);

-- Poll votes: authenticated users can vote and read
CREATE POLICY "Anyone can read poll votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Trigger to increment vote count
CREATE OR REPLACE FUNCTION public.handle_poll_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_poll_vote
  AFTER INSERT ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_poll_vote();
