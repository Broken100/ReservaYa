import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Service, ServiceInsert, ServiceUpdate } from '../types/database';

export function useServices(businessId: string | null) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('name') as { data: Service[] | null; error: { message: string } | null };

    if (err) setError(err.message);
    else setServices(data || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const addService = async (service: Omit<ServiceInsert, 'business_id'>) => {
    if (!businessId) return null;
    const { data, error: err } = await supabase
      .from('services')
      .insert({ ...service, business_id: businessId } as never)
      .select()
      .single() as { data: Service | null; error: { message: string } | null };

    if (err) { setError(err.message); throw new Error(err.message); }
    if (data) setServices(prev => [...prev, data]);
    return data;
  };

  const updateService = async (id: string, updates: ServiceUpdate) => {
    const { data, error: err } = await supabase
      .from('services')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single() as { data: Service | null; error: { message: string } | null };

    if (err) { setError(err.message); throw new Error(err.message); }
    if (data) setServices(prev => prev.map(s => s.id === id ? data : s));
    return data;
  };

  const deleteService = async (id: string) => {
    const { error: err } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (err) { setError((err as { message: string }).message); throw new Error((err as { message: string }).message); }
    setServices(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateService(id, { is_active: isActive });
  };

  return { services, loading, error, addService, updateService, deleteService, toggleActive, refresh: fetchServices };
}
