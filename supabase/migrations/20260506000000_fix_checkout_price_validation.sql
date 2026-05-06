-- Migration: Fix checkout RPC — validate unit_price against products table
-- Description: The original checkout RPC trusted client-supplied unit_price values.
-- This version fetches the actual price from the products table, preventing price manipulation.

CREATE OR REPLACE FUNCTION checkout(
  p_business_id uuid,
  p_client_id uuid,
  p_payment_method text,
  p_items jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order_id uuid;
  v_total decimal(10,2) := 0;
  v_item jsonb;
  v_stock integer;
  v_product_id uuid;
  v_quantity integer;
  v_actual_price decimal(10,2);
BEGIN
  -- Validate user
  IF auth.uid() != p_client_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify stock and calculate total using DB prices (NOT client-supplied prices)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    SELECT stock, price INTO v_stock, v_actual_price 
    FROM products 
    WHERE id = v_product_id AND is_active = true 
    FOR UPDATE;
    
    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found or inactive: %', v_product_id;
    END IF;
    
    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    -- Decrease stock
    UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;
    
    -- Use actual DB price, not client-supplied price
    v_total := v_total + (v_actual_price * v_quantity);
  END LOOP;

  -- Create order
  INSERT INTO orders (business_id, client_id, total_amount, payment_method, status)
  VALUES (p_business_id, p_client_id, v_total, p_payment_method::payment_method, 'pending')
  RETURNING id INTO v_order_id;

  -- Insert order items using actual DB price
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    -- Re-fetch price for this item (already validated above, but fetch again for insert)
    SELECT price INTO v_actual_price FROM products WHERE id = v_product_id;
    
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      v_order_id,
      v_product_id,
      v_quantity,
      v_actual_price
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;
