-- Editable profile link title + custom icon for the fixed link
ALTER TABLE public.link_bio_settings
  ADD COLUMN IF NOT EXISTS profile_link_title TEXT DEFAULT 'Meu perfil',
  ADD COLUMN IF NOT EXISTS profile_link_icon_url TEXT DEFAULT '';

-- Custom icon per link
ALTER TABLE public.link_bio_links
  ADD COLUMN IF NOT EXISTS icon_url TEXT DEFAULT '';
