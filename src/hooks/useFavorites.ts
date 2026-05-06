import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Favorite } from '../types/database';

export function useFavorites(profileId: string | null) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) { setFavorites([]); setLoading(false); return; }
    fetchFavorites();
  }, [profileId]);

  const fetchFavorites = async () => {
    if (!profileId) return;
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (!error && data) setFavorites(data as Favorite[]);
    } catch {} finally { setLoading(false); }
  };

  const toggleFavorite = useCallback(async (params: { businessId?: string; serviceId?: string; professionalId?: string; productId?: string }) => {
    if (!profileId) return;
    const match = { profile_id: profileId, business_id: params.businessId || null, service_id: params.serviceId || null, professional_id: params.professionalId || null, product_id: params.productId || null };
    const existing = favorites.find(f => f.business_id === match.business_id && f.service_id === match.service_id && f.professional_id === match.professional_id && f.product_id === match.product_id);
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites(prev => prev.filter(f => f.id !== existing.id));
    } else {
      const { data } = await supabase.from('favorites').insert(match).select().single();
      if (data) setFavorites(prev => [data as Favorite, ...prev]);
    }
  }, [profileId, favorites]);

  const isFavorited = useCallback((params: { businessId?: string; serviceId?: string; professionalId?: string; productId?: string }) => {
    return favorites.some(f => f.business_id === (params.businessId || null) && f.service_id === (params.serviceId || null) && f.professional_id === (params.professionalId || null) && f.product_id === (params.productId || null));
  }, [favorites]);

  return { favorites, loading, toggleFavorite, isFavorited };
}