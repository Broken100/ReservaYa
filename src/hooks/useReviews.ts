import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ReviewRow {
  id: string;
  business_id: string;
  client_id: string;
  target_type: 'business' | 'service' | 'professional' | 'product';
  target_id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  hidden: boolean;
  featured: boolean;
  created_at: string;
  client?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

export function useReviews(businessId: string | null, targetType?: string, targetId?: string) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) { setLoading(false); return; }
    fetchReviews();
  }, [businessId, targetType, targetId]);

  const fetchReviews = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('reviews')
        .select('*, client:profiles!reviews_client_id_fkey(id, full_name, avatar_url)')
        .eq('business_id', businessId)
        .eq('hidden', false)
        .order('created_at', { ascending: false });

      if (targetType) query = query.eq('target_type', targetType);
      if (targetId) query = query.eq('target_id', targetId);

      const { data, error } = await query;
      if (!error && data) {
        setReviews(data as ReviewRow[]);
        const ratings = (data as ReviewRow[]).map(r => r.rating);
        const avg = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(r => { dist[r] = (dist[r] || 0) + 1; });
        setStats({ average: avg, count: ratings.length, distribution: dist });
      }
    } catch (err) {
      console.error('[useReviews] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createReview = useCallback(async (review: { business_id: string; client_id: string; target_type: string; target_id: string; rating: number; comment?: string }) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review as any)
      .select('*, client:profiles!reviews_client_id_fkey(id, full_name, avatar_url)')
      .single();
    if (error) throw error;
    if (data) {
      setReviews(prev => [data as ReviewRow, ...prev]);
      await fetchReviews();
    }
    return data;
  }, []);

  return { reviews, stats, loading, createReview, refresh: fetchReviews };
}