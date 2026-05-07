-- Add chosen_role and selected_plan_id to profiles for explicit role/plan tracking

-- chosen_role: records the explicit role choice from the registration page
-- NULL means the user didn't go through registration (e.g., direct login)
-- 'admin' or 'client' means the user explicitly chose that role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chosen_role user_role;

-- selected_plan_id: records which plan the admin selected on PaymentPage
-- even before confirming/paying, so we can pre-select it if they come back
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES public.plans(id);

-- Update handle_new_user trigger to also set chosen_role from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, chosen_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'client'),
    (NEW.raw_user_meta_data ->> 'chosen_role')::public.user_role
  );
  RETURN NEW;
END;
$$;