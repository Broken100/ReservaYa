ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;
UPDATE plans SET is_recommended = true WHERE id = 'premium';