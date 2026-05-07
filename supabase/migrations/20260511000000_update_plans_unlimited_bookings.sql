-- Remove booking limit from starter plan (both plans now have unlimited bookings)
-- Differentiation is by features, not booking count
UPDATE plans SET max_bookings_per_month = NULL WHERE id = 'starter';

-- Add is_recommended column if not exists (safe idempotent)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;
UPDATE plans SET is_recommended = true WHERE id = 'premium';

-- Update plan features to reflect new structure
UPDATE plans SET 
  features = ARRAY['Citas ilimitadas', '1 Profesional', 'Soporte por email', 'Panel básico'],
  name = 'Plan Básico'
WHERE id = 'starter';

UPDATE plans SET 
  features = ARRAY['Citas ilimitadas', 'Profesionales ilimitados', 'Tienda y productos', 'Archivado y exportación', 'Soporte prioritario', 'Panel avanzado', 'Reportes IA'],
  name = 'Plan Pro'
WHERE id = 'premium';