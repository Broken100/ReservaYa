-- Add feedback columns to bookings
ALTER TABLE public.bookings
ADD COLUMN rating smallint CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN review text;

-- Add feedback columns to orders
ALTER TABLE public.orders
ADD COLUMN rating smallint CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN review text;
