-- Add payment_proof_url column to bookings and orders for transfer payment proof attachment
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;