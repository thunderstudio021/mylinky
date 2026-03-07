
-- Add is_creator flag to profiles (approved by admin, separate from verified badge)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_creator boolean DEFAULT false;

-- Update existing verified creators to also be is_creator
UPDATE public.profiles SET is_creator = true WHERE verified = true;

-- Update approve_creator function to set is_creator = true but NOT verified
CREATE OR REPLACE FUNCTION public.approve_creator(_application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _user_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO _user_id 
  FROM public.creator_applications 
  WHERE id = _application_id AND status = 'pending';

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found or already processed';
  END IF;

  UPDATE public.creator_applications 
  SET status = 'approved', reviewed_at = now() 
  WHERE id = _application_id;

  -- Set as creator but NOT verified (admin verifies separately)
  UPDATE public.profiles 
  SET is_creator = true, updated_at = now() 
  WHERE id = _user_id;
END;
$$;
