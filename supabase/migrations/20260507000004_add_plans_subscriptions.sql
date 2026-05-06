-- Plans and subscriptions tables for v2.1

-- Plans table
CREATE TABLE plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  max_bookings_per_month integer,
  max_professionals integer,
  annual_discount_pct numeric(5,2) DEFAULT 0,
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed plans
INSERT INTO plans (id, name, price_monthly, max_bookings_per_month, max_professionals, annual_discount_pct, features) VALUES
('starter', 'Plan Básico', 25.00, 50, 1, 3.00, ARRAY['Hasta 50 citas/mes', '1 Profesional', 'Soporte por email', 'Panel básico']),
('premium', 'Plan Pro', 45.00, NULL, NULL, 8.00, ARRAY['Citas ilimitadas', 'Profesionales ilimitados', 'Soporte prioritario', 'Panel avanzado', 'Reportes IA']);

-- Subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES plans(id),
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_profile ON subscriptions(profile_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_select_all ON plans FOR SELECT USING (true);
CREATE POLICY subscriptions_select_own ON subscriptions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY subscriptions_insert_own ON subscriptions FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY subscriptions_update_own ON subscriptions FOR UPDATE USING (auth.uid() = profile_id);
