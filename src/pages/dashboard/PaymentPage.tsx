import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, Star, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const navigate = useNavigate();

  const PLANS = [
    {
      id: 'starter',
      name: t('payment.plans.starter'),
      price: '25',
      features: [
        t('payment.features.upTo100'),
        t('payment.features.1Professional'),
        t('payment.features.emailSupport'),
        t('payment.features.basicPanel'),
      ],
      icon: Zap,
      color: 'blue'
    },
    {
      id: 'premium',
      name: t('payment.plans.premium'),
      price: '45',
      features: [
        t('payment.features.unlimited'),
        t('payment.features.unlimitedProfessionals'),
        t('payment.features.prioritySupport'),
        t('payment.features.advancedPanel'),
        t('payment.features.aiReports'),
      ],
      icon: Crown,
      color: 'purple',
      recommended: true
    }
  ];

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Simular delay de pago
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('profiles')
        .update({ 
          payment_status: 'active',
          role: 'admin' 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Recargar la página o navegar para que el AuthContext se actualice
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Payment failed:', err);
      alert(t('payment.errorPayment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-16">
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

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {PLANS.map((plan) => (
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
              {plan.recommended && (
                <div className="absolute -top-4 right-8 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {t('payment.recommended')}
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl ${plan.color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                  <plan.icon size={32} />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-500 ml-1">{t('payment.perMonth')}</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-6">{plan.name}</h3>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-400">
                    <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className={`w-full h-1.5 rounded-full bg-white/5 mb-2 overflow-hidden`}>
                <div 
                  className={`h-full transition-all duration-500 ${selectedPlan === plan.id ? 'w-full bg-blue-500' : 'w-0'}`} 
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-dark-card rounded-3xl p-8 lg:p-12 border border-white/5 text-center">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-dark-card bg-gray-800" />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {t('payment.trustBadge')}
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                loading
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
            <p className="mt-6 text-gray-500 text-sm">
              {t('payment.secureNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
