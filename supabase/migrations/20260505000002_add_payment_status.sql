-- Migration: Add payment_status to profiles
-- Description: Track payment/subscription status for business owners

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- Add constraint to ensure valid statuses
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_status') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT check_payment_status CHECK (payment_status IN ('pending', 'active', 'inactive'));
    END IF;
END $$;
