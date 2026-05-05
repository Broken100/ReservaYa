import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Business } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to get the current admin's business.
 * Returns the first business owned by the logged-in user.
 */
export function useBusiness() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1) as { data: Business[] | null; error: { message: string } | null };

      if (err) {
        console.error('[useBusiness] Fetch error:', err.message);
        setError(err.message);
      }
      setBusiness(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error('[useBusiness] Exception:', err);
      setError('Error al cargar datos del negocio');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    fetchBusiness(); 
    
    const handleBusinessUpdate = () => fetchBusiness();
    window.addEventListener('business_updated', handleBusinessUpdate);
    return () => window.removeEventListener('business_updated', handleBusinessUpdate);
  }, [fetchBusiness]);

  const createBusiness = async (businessData: Omit<Business, 'id' | 'owner_id' | 'created_at'>) => {
    if (!user) return null;
    const slug = businessData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const { data, error: err } = await supabase
      .from('businesses')
      .insert({ ...businessData, owner_id: user.id, slug } as never)
      .select()
      .single() as { data: Business | null; error: { message: string } | null };

    if (err) { setError(err.message); return null; }
    setBusiness(data);
    return data;
  };

  const updateBusiness = async (updates: Partial<Business>) => {
    if (!business) return null;
    const { data, error: err } = await supabase
      .from('businesses')
      .update(updates as never)
      .eq('id', business.id)
      .select()
      .single() as { data: Business | null; error: { message: string } | null };

    if (err) { 
      setError(err.message); 
      throw new Error(err.message); 
    }
    setBusiness(data);
    window.dispatchEvent(new Event('business_updated'));
    return data;
  };

  const deleteBusiness = async (id: string) => {
    const { error: err } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (err) {
      setError(err.message);
      throw new Error(err.message);
    }
    setBusiness(null);
    window.dispatchEvent(new Event('business_updated'));
    return true;
  };

  return { business, loading, error, createBusiness, updateBusiness, deleteBusiness, refresh: fetchBusiness };
}
