
-- Drop old function and recreate properly
DROP FUNCTION IF EXISTS public.approve_creator(UUID);

CREATE OR REPLACE FUNCTION public.approve_creator(_application_id UUID)
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

  -- Get user_id from application
  SELECT user_id INTO _user_id 
  FROM public.creator_applications 
  WHERE id = _application_id AND status = 'pending';

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found or already processed';
  END IF;

  -- Update application status
  UPDATE public.creator_applications 
  SET status = 'approved', reviewed_at = now() 
  WHERE id = _application_id;

  -- Set profile as verified (creator)
  UPDATE public.profiles 
  SET verified = true, updated_at = now() 
  WHERE id = _user_id;
END;
$$;

-- Also create reject function
CREATE OR REPLACE FUNCTION public.reject_creator(_application_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.creator_applications 
  SET status = 'rejected', reviewed_at = now() 
  WHERE id = _application_id AND status = 'pending';
END;
$$;
