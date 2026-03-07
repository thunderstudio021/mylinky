
-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any post
CREATE POLICY "Admins can update any post" ON public.posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
