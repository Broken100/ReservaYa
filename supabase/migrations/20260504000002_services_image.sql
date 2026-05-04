-- Add image_url to services table
alter table services add column if not exists image_url text;
