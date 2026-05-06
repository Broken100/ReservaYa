import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { OrderWithClient } from '../types/database';

export function useOrders({ businessId, clientId }: { businessId?: string | null, clientId?: string | null } = {}) {
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!businessId && !clientId) { setLoading(false); return; }
    setLoading(true);
    
    // We fetch orders, client profiles, business info, order items, and products
    let query = supabase
      .from('orders')
      .select(`
        *,
        client:profiles(full_name, email, phone),
        business:businesses(name, logo_url),
        items:order_items(
          *,
          product:products(name, image_url)
        )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (businessId) query = query.eq('business_id', businessId);
    if (clientId) query = query.eq('client_id', clientId);

    const { data, error: err } = await query;

    if (err) setError(err.message);
    else {
      // Filter out cancelled orders older than 24 hours
      const now = new Date().getTime();
      const filtered = data.filter(o => {
        if ((o as OrderWithClient).status === 'cancelled') {
          const orderTime = new Date((o as OrderWithClient).created_at).getTime();
          if (now - orderTime > 24 * 60 * 60 * 1000) return false;
        }
        return true;
      });
      setOrders(filtered);
    }
    
    setLoading(false);
  }, [businessId, clientId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: 'pending' | 'completed' | 'cancelled') => {
    const { error: err } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (err) { setError(err.message); throw new Error(err.message); }
    
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    return true;
  };

  const archiveOrder = async (id: string) => {
    const { error: err } = await supabase
      .from('orders')
      .update({ is_archived: true })
      .eq('id', id);

    if (err) { setError(err.message); throw new Error(err.message); }
    setOrders(prev => prev.filter(o => o.id !== id));
    return true;
  };

  return { orders, loading, error, updateOrderStatus, archiveOrder, refresh: fetchOrders };
}
