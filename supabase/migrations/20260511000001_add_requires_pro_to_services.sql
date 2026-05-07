-- Add requires_pro column to services table for Pro-gating
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_pro BOOLEAN DEFAULT false;