-- Security functions and triggers for v2.1

-- Function to activate a subscription (SECURE - doesn't change role directly)
-- The role change should be handled by a trigger when payment_status becomes 'active'
CREATE OR REPLACE FUNCTION activate_subscription(
  p_profile_id uuid,
  p_plan_id text,
  p_billing_period text DEFAULT 'monthly'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id uuid;
  v_plan_max_bookings integer;
BEGIN
  -- Validate plan exists
  SELECT max_bookings_per_month INTO v_plan_max_bookings FROM plans WHERE id = p_plan_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or inactive';
  END IF;

  -- Deactivate any existing active subscription
  UPDATE subscriptions SET status = 'cancelled', ends_at = now()
  WHERE profile_id = p_profile_id AND status = 'active';

  -- Create new subscription
  INSERT INTO subscriptions (profile_id, plan_id, billing_period, status, starts_at)
  VALUES (p_profile_id, p_plan_id, p_billing_period, 'active', now())
  RETURNING id INTO v_subscription_id;

  -- Update profile payment_status to active (this triggers the role change via trigger)
  UPDATE profiles SET payment_status = 'active' WHERE id = p_profile_id;

  RETURN v_subscription_id;
END;
$$;

-- Function to check booking limit for a business
CREATE OR REPLACE FUNCTION check_booking_limit(p_business_id uuid)
RETURNS TABLE(can_book boolean, remaining integer, limit_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
  v_plan_id text;
  v_max_bookings integer;
  v_current_count integer;
BEGIN
  -- Get business owner
  SELECT owner_id INTO v_owner_id FROM businesses WHERE id = p_business_id;

  -- Get active subscription plan
  SELECT s.plan_id INTO v_plan_id
  FROM subscriptions s
  WHERE s.profile_id = v_owner_id AND s.status = 'active'
  ORDER BY s.created_at DESC LIMIT 1;

  -- Get plan limits
  SELECT p.max_bookings_per_month INTO v_max_bookings
  FROM plans p WHERE p.id = v_plan_id;

  -- Count bookings this month
  SELECT COUNT(*) INTO v_current_count
  FROM bookings b
  WHERE b.business_id = p_business_id
    AND b.status != 'cancelled'
    AND date_trunc('month', b.booking_date) = date_trunc('month', now());

  -- If max_bookings is null, it means unlimited
  IF v_max_bookings IS NULL THEN
    RETURN QUERY SELECT true AS can_book, 999999 AS remaining, 'unlimited'::text AS limit_type;
  ELSIF v_current_count >= v_max_bookings THEN
    RETURN QUERY SELECT false AS can_book, 0 AS remaining, 'limited'::text AS limit_type;
  ELSE
    RETURN QUERY SELECT true AS can_book, (v_max_bookings - v_current_count) AS remaining, 'limited'::text AS limit_type;
  END IF;
END;
$$;

-- Trigger: When payment_status becomes 'active', set role to 'admin'
CREATE OR REPLACE FUNCTION handle_payment_activation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'active' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'active') THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_payment_activation ON profiles;
CREATE TRIGGER on_payment_activation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_activation();

-- Trigger: Prevent direct role changes from client side (RLS-level protection)
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow role changes via the payment activation trigger
  -- If role changed without payment_status being 'active', reject
  IF NEW.role IS DISTINCT FROM OLD.role AND NEW.payment_status != 'active' THEN
    RAISE EXCEPTION 'Cannot change role without active subscription';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_role_change_guard ON profiles;
CREATE TRIGGER on_role_change_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION prevent_role_change();
