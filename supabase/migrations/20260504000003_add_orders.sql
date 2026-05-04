-- Add Orders and Order Items tables

create type payment_method as enum ('cash', 'transfer');
create type order_status as enum ('pending', 'completed', 'cancelled');

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  client_id uuid references profiles(id) on delete cascade not null,
  total_amount decimal(10,2) not null,
  payment_method payment_method not null,
  status order_status not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies for orders
-- Clients can read their own orders
create policy "Clients can view own orders"
  on orders for select
  using (auth.uid() = client_id);

-- Business owners can read orders for their business
create policy "Business owners can view their orders"
  on orders for select
  using (
    auth.uid() in (
      select owner_id from businesses where id = orders.business_id
    )
  );

-- Clients can insert orders
create policy "Clients can insert orders"
  on orders for insert
  with check (auth.uid() = client_id);

-- Business owners can update order status
create policy "Business owners can update orders"
  on orders for update
  using (
    auth.uid() in (
      select owner_id from businesses where id = orders.business_id
    )
  );

-- Policies for order_items
create policy "Clients can view own order items"
  on order_items for select
  using (
    auth.uid() in (
      select client_id from orders where id = order_items.order_id
    )
  );

create policy "Business owners can view their order items"
  on order_items for select
  using (
    auth.uid() in (
      select owner_id from businesses 
      where id = (select business_id from orders where id = order_items.order_id)
    )
  );

create policy "Clients can insert order items"
  on order_items for insert
  with check (
    auth.uid() in (
      select client_id from orders where id = order_items.order_id
    )
  );

-- Create a secure RPC function to handle checkout transactions
create or replace function checkout(
  p_business_id uuid,
  p_client_id uuid,
  p_payment_method text,
  p_items jsonb -- Array of { product_id, quantity, unit_price }
) returns uuid language plpgsql security definer as $$
declare
  v_order_id uuid;
  v_total decimal(10,2) := 0;
  v_item jsonb;
  v_stock integer;
  v_product_id uuid;
  v_quantity integer;
begin
  -- Validate user
  if auth.uid() != p_client_id then
    raise exception 'Unauthorized';
  end if;

  -- Verify stock and calculate total
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    select stock into v_stock from products where id = v_product_id and is_active = true for update;
    
    if v_stock is null then
      raise exception 'Product not found or inactive: %', v_product_id;
    end if;
    
    if v_stock < v_quantity then
      raise exception 'Insufficient stock for product %', v_product_id;
    end if;

    -- Decrease stock
    update products set stock = stock - v_quantity where id = v_product_id;
    
    v_total := v_total + ((v_item->>'unit_price')::decimal * v_quantity);
  end loop;

  -- Create order
  insert into orders (business_id, client_id, total_amount, payment_method, status)
  values (p_business_id, p_client_id, v_total, p_payment_method::payment_method, 'pending')
  returning id into v_order_id;

  -- Insert order items
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, quantity, unit_price)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::decimal
    );
  end loop;

  return v_order_id;
end;
$$;
