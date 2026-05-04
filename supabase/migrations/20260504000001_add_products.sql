-- Create products table
create table products (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0.00,
  image_url text,
  is_active boolean default true,
  stock integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table products enable row level security;

-- Policies for products
create policy "Products are viewable by everyone"
on products for select
using ( true );

create policy "Business owners can insert their own products"
on products for insert
with check (
  auth.uid() in (
    select owner_id from businesses where id = business_id
  )
);

create policy "Business owners can update their own products"
on products for update
using (
  auth.uid() in (
    select owner_id from businesses where id = business_id
  )
);

create policy "Business owners can delete their own products"
on products for delete
using (
  auth.uid() in (
    select owner_id from businesses where id = business_id
  )
);
