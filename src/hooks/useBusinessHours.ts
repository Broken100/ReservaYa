import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { BusinessHours } from '../types/database';

export function useBusinessHours(businessId: string | null) {
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', businessId)
        .order('day_of_week', { ascending: true });

      if (err) throw err;
      
      // If no hours exist yet, we don't return anything (UI will handle default state)
      setHours(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchHours(); }, [fetchHours]);

  const updateHours = async (updatedHours: Omit<BusinessHours, 'id' | 'business_id'>[]) => {
    if (!businessId) return false;
    setLoading(true);
    try {
      // Upsert logic: we use the unique constraint (business_id, day_of_week)
      const toUpsert = updatedHours.map(h => ({
        ...h,
        business_id: businessId
      }));

      const { error: err } = await supabase
        .from('business_hours')
        .upsert(toUpsert as never, { onConflict: 'business_id, day_of_week' });

      if (err) throw err;
      
      await fetchHours();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { hours, loading, error, updateHours, refresh: fetchHours };
}
