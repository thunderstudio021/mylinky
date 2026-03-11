
-- Add CPF, phone, full_name to creator_applications
ALTER TABLE public.creator_applications ADD COLUMN IF NOT EXISTS full_name text DEFAULT '';
ALTER TABLE public.creator_applications ADD COLUMN IF NOT EXISTS cpf text DEFAULT '';
ALTER TABLE public.creator_applications ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.creator_applications ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';
ALTER TABLE public.creator_applications ADD COLUMN IF NOT EXISTS cover_url text DEFAULT '';

-- Add blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

-- RLS: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can read all user_roles
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can delete user_roles
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage policy for verification documents (private bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can upload own docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can read all docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
