import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useActiveSubscription } from './usePlans';
import { useBusiness } from './useBusiness';
import type { Plan } from '../types/database';

export function usePlanGating(userId: string | null) {
  const { plan, loading: planLoading } = useActiveSubscription(userId);
  const { business } = useBusiness();
  const [professionalCount, setProfessionalCount] = useState<number>(0);
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) {
      setCountsLoading(false);
      return;
    }

    async function fetchCounts() {
      setCountsLoading(true);
      const { count, error } = await supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business!.id);

      if (!error) setProfessionalCount(count ?? 0);
      setCountsLoading(false);
    }

    fetchCounts();
  }, [business?.id]);

  const loading = planLoading || countsLoading;

  const isPro = plan?.id === 'premium';
  const isStarter = plan?.id === 'starter';
  const isLegacyAdmin = !plan;

  const canAddProfessional = isPro
    ? true
    : isStarter
      ? professionalCount < (plan?.max_professionals ?? 1)
      : true;

  const canUseStore = isPro;
  const canUseArchive = isPro;
  const canUseReports = isPro;

  const limitReached = {
    professionals: !canAddProfessional,
  };

  const upgradePrompt = {
    professionals: !canAddProfessional ? 'planGating.professionalLimit' : null,
    store: !isPro ? 'planGating.storeUpgrade' : null,
    archive: !isPro ? 'planGating.archiveUpgrade' : null,
  };

  return {
    plan,
    loading,
    isPro,
    isStarter,
    isLegacyAdmin,
    canAddProfessional,
    canUseStore,
    canUseArchive,
    canUseReports,
    limitReached,
    upgradePrompt,
    professionalCount,
  };
}