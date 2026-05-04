-- =============================================
-- ReservaYa — Row Level Security Policies
-- =============================================
-- Roles:
--   admin  = business owner → full CRUD on own business data
--   client = end user       → read public data, CRUD own bookings

-- ─── Enable RLS on all tables ─────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ─────────────────────────────────
-- Users can read profiles (needed for admins to see client details)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert from trigger (service role)
CREATE POLICY "profiles_insert_trigger"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── BUSINESSES ───────────────────────────────
-- Anyone authenticated can read active businesses
CREATE POLICY "businesses_select_public"
  ON businesses FOR SELECT
  USING (true);

-- Admin can insert their own business
CREATE POLICY "businesses_insert_admin"
  ON businesses FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update their own business
CREATE POLICY "businesses_update_admin"
  ON businesses FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Admin can delete their own business
CREATE POLICY "businesses_delete_admin"
  ON businesses FOR DELETE
  USING (auth.uid() = owner_id);

-- ─── SERVICES ─────────────────────────────────
-- Anyone can read active services
CREATE POLICY "services_select_public"
  ON services FOR SELECT
  USING (true);

-- Admin can insert services for their business
CREATE POLICY "services_insert_admin"
  ON services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- Admin can update services for their business
CREATE POLICY "services_update_admin"
  ON services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- Admin can delete services for their business
CREATE POLICY "services_delete_admin"
  ON services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- ─── PROFESSIONALS ────────────────────────────
-- Anyone can read active professionals
CREATE POLICY "professionals_select_public"
  ON professionals FOR SELECT
  USING (true);

-- Admin can CUD professionals for their business
CREATE POLICY "professionals_insert_admin"
  ON professionals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "professionals_update_admin"
  ON professionals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "professionals_delete_admin"
  ON professionals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- ─── BUSINESS HOURS ───────────────────────────
-- Anyone can read business hours
CREATE POLICY "business_hours_select_public"
  ON business_hours FOR SELECT
  USING (true);

-- Admin can CUD hours for their business
CREATE POLICY "business_hours_insert_admin"
  ON business_hours FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "business_hours_update_admin"
  ON business_hours FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "business_hours_delete_admin"
  ON business_hours FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- ─── BOOKINGS ─────────────────────────────────
-- Admin can read all bookings for their business
CREATE POLICY "bookings_select_admin"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- Client can read their own bookings
CREATE POLICY "bookings_select_client"
  ON bookings FOR SELECT
  USING (auth.uid() = client_id);

-- Client can create bookings
CREATE POLICY "bookings_insert_client"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Client can update their own bookings (cancel)
CREATE POLICY "bookings_update_client"
  ON bookings FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Admin can update bookings for their business (confirm, complete)
CREATE POLICY "bookings_update_admin"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- Admin can delete bookings for their business
CREATE POLICY "bookings_delete_admin"
  ON bookings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()
    )
  );
