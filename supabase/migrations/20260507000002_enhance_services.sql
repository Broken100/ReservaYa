-- Enhance services table with category, duration display, inclusions, and recommendations
ALTER TABLE services ADD COLUMN category text;
ALTER TABLE services ADD COLUMN duration_display text;
ALTER TABLE services ADD COLUMN whats_included text;
ALTER TABLE services ADD COLUMN recommendations text;
