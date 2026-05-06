import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Plan, Subscription } from '../types/database';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error: err } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly');

        if (err) throw err;
        setPlans(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return { plans, loading, error };
}

export function useActiveSubscription(profileId: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('profile_id', profileId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setSubscription(data);
          setPlan(data.plans as unknown as Plan);
        }
      } catch {
        // Subscription may not exist yet
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, [profileId]);

  return { subscription, plan, loading };
}

export async function activateSubscription(
  profileId: string,
  planId: string,
  billingPeriod: 'monthly' | 'annual'
) {
  const { data, error } = await supabase.rpc('activate_subscription', {
    p_profile_id: profileId,
    p_plan_id: planId,
    p_billing_period: billingPeriod,
  });

  if (error) throw error;
  return data;
}