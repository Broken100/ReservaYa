import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ClientInfo {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  booking_count: number;
  order_count: number;
  last_activity: string | null;
}

export function useClients(businessId: string | null) {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);

    try {
      // 1. Fetch bookings for this business
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('client_id, booking_date, profiles!bookings_client_id_fkey(id, full_name, email, phone, avatar_url)')
        .eq('business_id', businessId) as { data: any[] | null, error: any };

      if (bookingsError) throw bookingsError;

      // 2. Fetch orders for this business
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('client_id, created_at, profiles!orders_client_id_fkey(id, full_name, email, phone, avatar_url)')
        .eq('business_id', businessId) as { data: any[] | null, error: any };

      if (ordersError) throw ordersError;

      // Aggregate by client
      const clientMap = new Map<string, ClientInfo>();

      // Process bookings
      for (const row of bookingsData || []) {
        if (!row.profiles) continue;
        const existing = clientMap.get(row.client_id);
        if (existing) {
          existing.booking_count++;
          if (new Date(row.booking_date) > new Date(existing.last_activity || 0)) {
            existing.last_activity = row.booking_date;
          }
        } else {
          clientMap.set(row.client_id, {
            id: row.profiles.id,
            full_name: row.profiles.full_name,
            email: row.profiles.email,
            phone: row.profiles.phone,
            avatar_url: row.profiles.avatar_url,
            booking_count: 1,
            order_count: 0,
            last_activity: row.booking_date,
          });
        }
      }

      // Process orders
      for (const row of ordersData || []) {
        if (!row.profiles) continue;
        const existing = clientMap.get(row.client_id);
        const orderDate = row.created_at.split('T')[0];
        if (existing) {
          existing.order_count++;
          if (new Date(orderDate) > new Date(existing.last_activity || 0)) {
            existing.last_activity = orderDate;
          }
        } else {
          clientMap.set(row.client_id, {
            id: row.profiles.id,
            full_name: row.profiles.full_name,
            email: row.profiles.email,
            phone: row.profiles.phone,
            avatar_url: row.profiles.avatar_url,
            booking_count: 0,
            order_count: 1,
            last_activity: orderDate,
          });
        }
      }

      setClients(Array.from(clientMap.values()));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  return { clients, loading, error, refresh: fetchClients };
}
