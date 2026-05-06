import { useState, useEffect, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, Star, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  annual_discount_pct: number;
  features: string[];
  max_bookings_per_month: number | null;
  max_professionals: number | null;
  is_recommended: boolean;
  is_active: boolean;
}

export default function PaymentPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      const plansData = (data || []) as Plan[];
      setPlans(plansData);
      if (plansData.length > 0) {
        const recommended = plansData.find((p) => p.is_recommended);
        setSelectedPlan(recommended ? recommended.id : plansData[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      toast.error(t('payment.errorLoadingPlans'));
    } finally {
      setLoadingPlans(false);
    }
  };

  const calculateAnnualPrice = (monthlyPrice: number, discountPct: number) => {
    return monthlyPrice * 12 * (1 - discountPct / 100);
  };

  const getDisplayPrice = (plan: Plan) => {
    if (billingPeriod === 'monthly') return plan.price_monthly;
    return calculateAnnualPrice(plan.price_monthly, plan.annual_discount_pct);
  };

  const getMonthlyEquivalent = (plan: Plan) => {
    const annual = calculateAnnualPrice(plan.price_monthly, plan.annual_discount_pct);
    return annual / 12;
  };

  const formatPrice = (price: number) => {
    return Math.round(price).toLocaleString();
  };

  const formatBookings = (max: number | null) => {
    if (max === null || max === 0) return t('payment.unlimitedBookings');
    return t('payment.upToBookings', { max });
  };

  const formatProfessionals = (max: number | null) => {
    if (max === null || max === 0) return t('payment.unlimitedProfessionals');
    return t('payment.maxProfessionals', { max });
  };

  const handlePayment = async () => {
    if (!user || !selectedPlan) return;
    setLoading(true);

    try {
      const { error } = await (supabase.rpc as any)('activate_subscription', {
        p_profile_id: user.id,
        p_plan_id: selectedPlan,
        p_billing_period: billingPeriod,
      });

      if (error) throw error;

      toast.success(t('payment.successSubscription'));
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      console.error('Payment failed:', err);
      toast.error(t('payment.errorPayment'));
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);
  const iconMap: Record<string, ComponentType<{ size?: number }>> = {
    Crown,
    Zap,
    Star,
  };

  if (loadingPlans) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
          >
            <ShieldCheck size={16} />
            {t('payment.secureAccess')}
          </motion.div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            {t('payment.title')}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('payment.subtitle')}
          </p>
        </header>

        <div className="flex justify-center mb-10">
          <div className="relative flex items-center bg-dark-card rounded-2xl p-1.5 border border-white/5">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all z-10 ${
                billingPeriod === 'monthly'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('payment.monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all z-10 ${
                billingPeriod === 'annual'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('payment.annual')}
            </button>
            <motion.div
              layout
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-blue-600"
              style={{
                width: 'calc(50% - 6px)',
                left: billingPeriod === 'monthly' ? '3px' : '50%',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </div>

        <div
          className={`grid gap-8 mb-16 ${
            plans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'
          }`}
        >
          {plans.map((plan) => {
            const IconComponent = iconMap[plan.id] || Zap;
            const displayPrice = getDisplayPrice(plan);
            const monthlyEq = getMonthlyEquivalent(plan);
            const isAnnual = billingPeriod === 'annual';
            const hasAnnualDiscount = plan.annual_discount_pct > 0;

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-8 rounded-3xl border transition-all cursor-pointer ${
                  selectedPlan === plan.id
                    ? 'bg-dark-card border-blue-500 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]'
                    : 'bg-dark-card/50 border-white/5 hover:border-white/10'
                }`}
              >
                {plan.is_recommended && (
                  <div className="absolute -top-4 right-8 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                    {t('payment.recommended')}
                  </div>
                )}

                <div className="flex items-center justify-between mb-8">
                  <div
                    className={`p-4 rounded-2xl ${
                      plan.id === 'premium'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <IconComponent size={32} />
                  </div>
                  <div className="text-right">
                    {isAnnual ? (
                      <>
                        <div className="text-2xl font-bold text-gray-500 line-through">
                          ${formatPrice(plan.price_monthly * 12)}
                        </div>
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-3xl font-bold text-white">
                            ${formatPrice(displayPrice)}
                          </span>
                          <span className="text-gray-500">{t('payment.perYear')}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          ${formatPrice(monthlyEq)}{t('payment.perMonth')}
                        </div>
                        {hasAnnualDiscount && (
                          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/20">
                            {t('payment.savePercent', { pct: plan.annual_discount_pct })}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-white">
                          ${formatPrice(displayPrice)}
                        </span>
                        <span className="text-gray-500 ml-1">{t('payment.perMonth')}</span>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {formatBookings(plan.max_bookings_per_month)}
                  {' · '}
                  {formatProfessionals(plan.max_professionals)}
                </p>

                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-400">
                      <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="w-full h-1.5 rounded-full bg-white/5 mb-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedPlan === plan.id ? 'w-full bg-blue-500' : 'w-0'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-dark-card rounded-3xl p-8 lg:p-12 border border-white/5 text-center">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-dark-card bg-gray-800"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">{t('payment.trustBadge')}</p>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || !selectedPlan}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                loading || !selectedPlan
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('payment.processing')}
                </>
              ) : (
                <>
                  <CreditCard size={22} />
                  {t('payment.confirmSubscription')}
                </>
              )}
            </button>
            <p className="mt-6 text-gray-500 text-sm">{t('payment.secureNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
