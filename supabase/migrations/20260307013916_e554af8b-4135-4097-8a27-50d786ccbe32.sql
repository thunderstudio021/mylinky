
-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

CREATE POLICY "Anyone can read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
