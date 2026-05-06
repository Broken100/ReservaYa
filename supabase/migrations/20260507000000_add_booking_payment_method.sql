-- Add payment_method column to bookings table
-- Uses the existing payment_method enum created in 20260504000003_add_orders.sql
ALTER TABLE bookings ADD COLUMN payment_method payment_method DEFAULT 'cash';
