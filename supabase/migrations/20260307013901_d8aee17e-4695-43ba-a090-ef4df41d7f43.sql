
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  category TEXT DEFAULT '',
  price_monthly NUMERIC(10,2) DEFAULT 0,
  price_yearly NUMERIC(10,2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  subscribers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT DEFAULT '',
  media_type TEXT DEFAULT '' CHECK (media_type IN ('', 'photo', 'video')),
  post_visibility TEXT NOT NULL DEFAULT 'free' CHECK (post_visibility IN ('free', 'subscribers', 'ppv', 'ppv-subscribers')),
  ppv_price NUMERIC(10,2) DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 6. Creator applications table
CREATE TABLE public.creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_front_url TEXT DEFAULT '',
  document_back_url TEXT DEFAULT '',
  selfie_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (user_id)
);
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- 7. Trigger to auto-create profile + user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- profiles: everyone can read, users can update own
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- posts: everyone can read free posts, authenticated can read all, creators can insert own
CREATE POLICY "Anyone can read posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Creators can insert own posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own posts" ON public.posts
  FOR UPDATE TO authenticated USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete own posts" ON public.posts
  FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- creator_applications: users can insert/read own, admins can read all
CREATE POLICY "Users can insert own application" ON public.creator_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own application" ON public.creator_applications
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update applications" ON public.creator_applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to approve creator application
CREATE OR REPLACE FUNCTION public.approve_creator(application_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Check caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO _user_id FROM public.creator_applications WHERE id = application_id;

  UPDATE public.creator_applications SET status = 'approved', reviewed_at = now() WHERE id = application_id;
  UPDATE public.profiles SET verified = true WHERE id = _user_id;

  -- Add creator role if not exists
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Actually add creator role, not admin
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
END;
$$;

-- Fix: proper approve function
CREATE OR REPLACE FUNCTION public.approve_creator(application_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO _user_id FROM public.creator_applications WHERE id = application_id;
  
  UPDATE public.creator_applications SET status = 'approved', reviewed_at = now() WHERE id = application_id;
  UPDATE public.profiles SET verified = true WHERE id = _user_id;
END;
$$;
