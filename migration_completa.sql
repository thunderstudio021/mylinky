-- ============================================================
--  MYLINKY — MIGRAÇÃO COMPLETA DO BANCO DE DADOS
--  Cole este SQL no Supabase SQL Editor do novo projeto
--  e clique em "Run". Pronto.
-- ============================================================

-- ─── 1. TIPOS (ENUMS) ────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ─── 2. TABELAS ──────────────────────────────────────────────

-- Perfis de usuários
CREATE TABLE public.profiles (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  username          text        NOT NULL UNIQUE,
  email             text        NOT NULL,
  bio               text,
  avatar_url        text,
  cover_url         text,
  category          text,
  is_creator        boolean     DEFAULT false,
  verified          boolean     DEFAULT false,
  blocked           boolean     DEFAULT false,
  followers_count   integer     DEFAULT 0,
  subscribers_count integer     DEFAULT 0,
  price_monthly     numeric     DEFAULT 0,
  price_yearly      numeric     DEFAULT 0,
  commission_rate   numeric     DEFAULT 20,
  welcome_message   text,
  whatsapp          text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Papéis/roles dos usuários
CREATE TABLE public.user_roles (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Posts
CREATE TABLE public.posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content          text        NOT NULL DEFAULT '',
  media_url        text,
  media_type       text,
  post_visibility  text        NOT NULL DEFAULT 'free',
  ppv_price        numeric     DEFAULT 0,
  likes_count      integer     DEFAULT 0,
  comments_count   integer     DEFAULT 0,
  comments_enabled boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- Curtidas
CREATE TABLE public.likes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Comentários
CREATE TABLE public.comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text        NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Seguidores
CREATE TABLE public.followers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);

-- Assinaturas
CREATE TABLE public.subscriptions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan           text        NOT NULL DEFAULT 'monthly',
  amount         numeric     NOT NULL DEFAULT 0,
  payment_method text        NOT NULL DEFAULT 'pix',
  status         text        NOT NULL DEFAULT 'active',
  expires_at     timestamptz,
  created_at     timestamptz DEFAULT now()
);

-- Compras PPV
CREATE TABLE public.ppv_purchases (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id        uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  amount         numeric     NOT NULL,
  payment_method text        NOT NULL DEFAULT 'pix',
  created_at     timestamptz DEFAULT now()
);

-- Presentes/gorjetas
CREATE TABLE public.gifts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id        uuid        REFERENCES public.posts(id) ON DELETE SET NULL,
  amount         numeric     NOT NULL,
  payment_method text        NOT NULL DEFAULT 'pix',
  created_at     timestamptz DEFAULT now()
);

-- Solicitações para ser criador
CREATE TABLE public.creator_applications (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text,
  cpf                 text,
  phone               text,
  avatar_url          text,
  cover_url           text,
  document_front_url  text,
  document_back_url   text,
  selfie_url          text,
  status              text        NOT NULL DEFAULT 'pending',
  admin_notes         text,
  reviewed_at         timestamptz,
  created_at          timestamptz DEFAULT now()
);

-- Saques
CREATE TABLE public.withdrawal_requests (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount                numeric     NOT NULL,
  pix_key               text        NOT NULL,
  pix_key_holder_name   text        NOT NULL,
  bank_name             text        NOT NULL,
  status                text        NOT NULL DEFAULT 'pending',
  admin_notes           text,
  reviewed_at           timestamptz,
  created_at            timestamptz DEFAULT now()
);

-- Notificações
CREATE TABLE public.notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id      uuid        REFERENCES public.posts(id) ON DELETE SET NULL,
  type         text        NOT NULL,
  title        text        NOT NULL,
  message      text        NOT NULL DEFAULT '',
  read         boolean     NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- Conversas (chat)
CREATE TABLE public.conversations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Mensagens
CREATE TABLE public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         text        NOT NULL DEFAULT '',
  read            boolean     NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Enquetes
CREATE TABLE public.polls (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Opções de enquete
CREATE TABLE public.poll_options (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid        NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text        text        NOT NULL,
  position    integer     NOT NULL DEFAULT 0,
  votes_count integer     NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Votos em enquetes
CREATE TABLE public.poll_votes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid        NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id  uuid        NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Banners do carrossel
CREATE TABLE public.banners (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  text        NOT NULL,
  link_url   text        NOT NULL DEFAULT '',
  position   integer     NOT NULL DEFAULT 0,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Configurações globais do site
CREATE TABLE public.site_settings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url             text,
  primary_color_light  text        NOT NULL DEFAULT '358 74% 59%',
  primary_color_dark   text        NOT NULL DEFAULT '358 74% 59%',
  instagram_url        text        NOT NULL DEFAULT '',
  tiktok_url           text        NOT NULL DEFAULT '',
  twitter_url          text        NOT NULL DEFAULT '',
  facebook_url         text        NOT NULL DEFAULT '',
  youtube_url          text        NOT NULL DEFAULT '',
  whatsapp_url         text        NOT NULL DEFAULT '',
  footer_text          text        NOT NULL DEFAULT '',
  updated_at           timestamptz DEFAULT now()
);
INSERT INTO public.site_settings DEFAULT VALUES;

-- Afiliações
CREATE TABLE public.affiliate_relationships (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code   text        UNIQUE DEFAULT substring(md5(random()::text), 1, 10),
  commission_rate numeric     NOT NULL DEFAULT 20,
  status          text        NOT NULL DEFAULT 'active',
  created_at      timestamptz DEFAULT now(),
  UNIQUE(affiliate_id, creator_id)
);

-- Ganhos de afiliados
CREATE TABLE public.affiliate_earnings (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type  text,
  gross_amount      numeric,
  commission_amount numeric,
  created_at        timestamptz DEFAULT now()
);

-- ─── 3. FUNÇÕES ──────────────────────────────────────────────

-- Verifica se o usuário tem um papel
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Aprova criador
CREATE OR REPLACE FUNCTION public.approve_creator(_application_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.creator_applications WHERE id = _application_id;
  UPDATE public.creator_applications
    SET status = 'approved', reviewed_at = now()
    WHERE id = _application_id;
  UPDATE public.profiles
    SET is_creator = true, verified = true
    WHERE id = v_user_id;
END;
$$;

-- Rejeita criador
CREATE OR REPLACE FUNCTION public.reject_creator(_application_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.creator_applications
    SET status = 'rejected', reviewed_at = now()
    WHERE id = _application_id;
END;
$$;

-- Cria perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'))
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: novo usuário → cria perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualiza likes_count ao curtir/descurtir
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

-- Atualiza comments_count
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();

-- Atualiza followers_count
CREATE OR REPLACE FUNCTION public.update_followers_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER on_follower_change
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW EXECUTE FUNCTION public.update_followers_count();

-- Atualiza subscribers_count
CREATE OR REPLACE FUNCTION public.update_subscribers_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET subscribers_count = subscribers_count + 1 WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status != 'active' AND OLD.status = 'active') THEN
    UPDATE public.profiles SET subscribers_count = GREATEST(0, subscribers_count - 1) WHERE id = COALESCE(NEW.creator_id, OLD.creator_id);
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR DELETE OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscribers_count();

-- Atualiza votos em enquete
CREATE OR REPLACE FUNCTION public.update_poll_votes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.poll_options SET votes_count = votes_count + 1 WHERE id = NEW.option_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER on_poll_vote
  AFTER INSERT ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_poll_votes_count();

-- ─── 4. ROW LEVEL SECURITY (RLS) ─────────────────────────────

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppv_purchases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_earnings    ENABLE ROW LEVEL SECURITY;

-- profiles: leitura pública, edição própria
CREATE POLICY "profiles: leitura pública"    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles: edição própria"     ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles: inserção"           ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles: somente leitura pelo próprio
CREATE POLICY "user_roles: leitura própria"  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles: admin"            ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- posts: leitura pública, criador gerencia os seus
CREATE POLICY "posts: leitura pública"       ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts: inserção"              ON public.posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "posts: edição própria"        ON public.posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "posts: exclusão"              ON public.posts FOR DELETE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- likes
CREATE POLICY "likes: leitura pública"      ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes: inserção"             ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes: exclusão própria"     ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- comments
CREATE POLICY "comments: leitura pública"   ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments: inserção"          ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments: exclusão"          ON public.comments FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- followers
CREATE POLICY "followers: leitura pública"  ON public.followers FOR SELECT USING (true);
CREATE POLICY "followers: inserção"         ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "followers: exclusão própria" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- subscriptions
CREATE POLICY "subscriptions: leitura"      ON public.subscriptions FOR SELECT USING (auth.uid() = subscriber_id OR auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "subscriptions: inserção"     ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
CREATE POLICY "subscriptions: atualização"  ON public.subscriptions FOR UPDATE USING (auth.uid() = subscriber_id OR has_role(auth.uid(), 'admin'));

-- ppv_purchases
CREATE POLICY "ppv: leitura"               ON public.ppv_purchases FOR SELECT USING (auth.uid() = buyer_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "ppv: inserção"              ON public.ppv_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- gifts
CREATE POLICY "gifts: leitura"             ON public.gifts FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "gifts: inserção"            ON public.gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- creator_applications
CREATE POLICY "apps: leitura própria"      ON public.creator_applications FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "apps: inserção"             ON public.creator_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "apps: admin"               ON public.creator_applications FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- withdrawal_requests
CREATE POLICY "saques: leitura"           ON public.withdrawal_requests FOR SELECT USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "saques: inserção"          ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "saques: admin"             ON public.withdrawal_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- notifications
CREATE POLICY "notif: leitura"            ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif: inserção"           ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif: atualização"        ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif: exclusão"           ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- conversations
CREATE POLICY "conv: leitura"             ON public.conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "conv: inserção"            ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- messages
CREATE POLICY "msg: leitura"              ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));
CREATE POLICY "msg: inserção"             ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg: atualização"          ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));

-- polls / poll_options / poll_votes
CREATE POLICY "polls: leitura pública"    ON public.polls FOR SELECT USING (true);
CREATE POLICY "polls: inserção"           ON public.polls FOR INSERT WITH CHECK (true);
CREATE POLICY "poll_options: leitura"     ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "poll_options: inserção"    ON public.poll_options FOR INSERT WITH CHECK (true);
CREATE POLICY "poll_votes: leitura"       ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "poll_votes: inserção"      ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- banners: leitura pública, admin gerencia
CREATE POLICY "banners: leitura pública"  ON public.banners FOR SELECT USING (true);
CREATE POLICY "banners: admin"            ON public.banners FOR ALL USING (has_role(auth.uid(), 'admin'));

-- site_settings: leitura pública, admin gerencia
CREATE POLICY "settings: leitura pública" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings: admin"           ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- affiliate_relationships / affiliate_earnings
CREATE POLICY "afil: leitura"             ON public.affiliate_relationships FOR SELECT USING (true);
CREATE POLICY "afil: inserção"            ON public.affiliate_relationships FOR INSERT WITH CHECK (auth.uid() = affiliate_id);
CREATE POLICY "afil: admin"              ON public.affiliate_relationships FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "earnings: leitura"         ON public.affiliate_earnings FOR SELECT USING (auth.uid() = affiliate_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "earnings: inserção"        ON public.affiliate_earnings FOR INSERT WITH CHECK (true);

-- ─── 5. STORAGE BUCKETS (via SQL) ────────────────────────────
-- Cria o bucket "media" para fotos, vídeos, banners e documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm','application/pdf']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "media: leitura pública"    ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media: upload autenticado" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "media: exclusão própria"   ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "docs: upload autenticado"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "docs: leitura autenticada" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
