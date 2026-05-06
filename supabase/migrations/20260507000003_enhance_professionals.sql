-- Enhance professionals table with richer profile fields
ALTER TABLE professionals ADD COLUMN full_name text;
ALTER TABLE professionals ADD COLUMN position text;
ALTER TABLE professionals ADD COLUMN years_experience integer;
ALTER TABLE professionals ADD COLUMN bio text;
ALTER TABLE professionals ADD COLUMN featured_services uuid[];
ALTER TABLE professionals ADD COLUMN slogan text;
ALTER TABLE professionals ADD COLUMN availability_notes text;
ALTER TABLE professionals ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
