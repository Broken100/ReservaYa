import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Professional, ProfessionalInsert, ProfessionalUpdate } from '../types/database';

export function useProfessionals(businessId: string | null) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('professionals')
      .select('*')
      .eq('business_id', businessId)
      .order('name') as { data: Professional[] | null; error: { message: string } | null };

    if (err) setError(err.message);
    else setProfessionals(data || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchProfessionals(); }, [fetchProfessionals]);

  const addProfessional = async (pro: Omit<ProfessionalInsert, 'business_id'>) => {
    if (!businessId) return null;
    const { data, error: err } = await supabase
      .from('professionals')
      .insert({ ...pro, business_id: businessId } as never)
      .select()
      .single() as { data: Professional | null; error: { message: string } | null };

    if (err) { setError(err.message); throw new Error(err.message); }
    if (data) setProfessionals(prev => [...prev, data]);
    return data;
  };

  const updateProfessional = async (id: string, updates: ProfessionalUpdate) => {
    const { data, error: err } = await supabase
      .from('professionals')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single() as { data: Professional | null; error: { message: string } | null };

    if (err) { setError(err.message); throw new Error(err.message); }
    if (data) setProfessionals(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deleteProfessional = async (id: string) => {
    const { error: err } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id);

    if (err) { setError((err as { message: string }).message); throw new Error((err as { message: string }).message); }
    setProfessionals(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateProfessional(id, { is_active: isActive });
  };

  return { professionals, loading, error, addProfessional, updateProfessional, deleteProfessional, toggleActive, refresh: fetchProfessionals };
}
