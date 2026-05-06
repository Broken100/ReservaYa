import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useActiveSubscription } from './usePlans';
import { useBusiness } from './useBusiness';
import type { Plan } from '../types/database';

export function usePlanGating(userId: string | null) {
  const { plan, loading: planLoading } = useActiveSubscription(userId);
  const { business } = useBusiness();
  const [professionalCount, setProfessionalCount] = useState<number>(0);
  const [bookingCount, setBookingCount] = useState<number>(0);
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) {
      setCountsLoading(false);
      return;
    }

    async function fetchCounts() {
      setCountsLoading(true);
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const [profResult, bookingResult] = await Promise.all([
        supabase
          .from('professionals')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business!.id),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business!.id)
          .gte('booking_date', startOfMonth)
          .neq('status', 'cancelled'),
      ]);

      setProfessionalCount(profResult.count ?? 0);
      setBookingCount(bookingResult.count ?? 0);
      setCountsLoading(false);
    }

    fetchCounts();
  }, [business?.id]);

  const loading = planLoading || countsLoading;

  const isPro = plan === null
    ? false
    : plan.max_bookings_per_month === null && plan.max_professionals === null;

  const canAddProfessional = plan === null
    ? true
    : plan.max_professionals === null
      ? true
      : professionalCount < plan.max_professionals;

  const canCreateBooking = plan === null
    ? true
    : plan.max_bookings_per_month === null
      ? true
      : bookingCount < plan.max_bookings_per_month;

  const limitReached = {
    professionals: !canAddProfessional,
    bookings: !canCreateBooking,
  };

  const upgradePrompt = {
    professionals: !canAddProfessional ? `plan.upgradeProfessional` : null,
    bookings: !canCreateBooking ? `plan.upgradeBookings` : null,
  };

  return {
    plan,
    loading,
    canAddProfessional,
    canCreateBooking,
    isPro,
    limitReached,
    upgradePrompt,
    professionalCount,
    bookingCount,
  };
}