-- Enhance products table with category, key features, and instructions
ALTER TABLE products ADD COLUMN category text;
ALTER TABLE products ADD COLUMN key_features text[];
ALTER TABLE products ADD COLUMN instructions text;
