-- Favorites table for clients to bookmark businesses, services, professionals, products
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT at_least_one_target CHECK (
    business_id IS NOT NULL OR service_id IS NOT NULL OR professional_id IS NOT NULL OR product_id IS NOT NULL
  ),
  CONSTRAINT unique_favorite UNIQUE (profile_id, business_id, service_id, professional_id, product_id)
);

-- RLS: users can only see/manage their own favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = profile_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_favorites_profile ON favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_business ON favorites(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_service ON favorites(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_professional ON favorites(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id) WHERE product_id IS NOT NULL;