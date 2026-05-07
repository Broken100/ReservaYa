-- Fix: Allow role change during initial registration (payment_status = 'pending')
-- The previous trigger blocked ALL role changes when payment_status != 'active',
-- which broke the registration flow where a new user selects "business owner" (admin role)
-- but their profile is created with role='client' and payment_status='pending'.

CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NEW.payment_status != 'active' AND OLD.payment_status != 'pending' THEN
    RAISE EXCEPTION 'Cannot change role without active subscription';
  END IF;
  RETURN NEW;
END;
$$;