import { useTranslation } from 'react-i18next';
import { Calendar, Package, Users, TrendingUp, Clock, ChevronRight, ShoppingBag, Banknote, CreditCard, Crown, AlertTriangle, Infinity, ArrowRight } from 'lucide-react';
import { useBusiness } from '../../hooks/useBusiness';
import { useBookings } from '../../hooks/useBookings';
import { useOrders } from '../../hooks/useOrders';
import { useClients } from '../../hooks/useClients';
import { useActiveSubscription } from '../../hooks/usePlans';
import { usePlanGating } from '../../hooks/usePlanGating';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, SkeletonCard } from '../../components/ui';

export default function OverviewPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const { user, profile } = useAuth();
  const activeProducts = business?.settings?.enable_products;

  const { bookings, loading: bookingsLoading } = useBookings({ businessId: business?.id ?? null });
  const { orders, loading: ordersLoading } = useOrders({ businessId: business?.id ?? null });
  const { clients, loading: clientsLoading } = useClients(business?.id ?? null);
  const { plan, loading: planLoading } = useActiveSubscription(user?.id ?? null);
  const { isPro, isStarter } = usePlanGating(user?.id ?? null);
  const isLegacyAdmin = profile?.role === 'admin' && profile?.payment_status === 'active' && !plan;

  if (bookingsLoading || (activeProducts && ordersLoading) || clientsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: activeProducts ? 5 : 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed');

  const totalServiceRevenue = completedBookings.reduce((sum, b) => sum + (b.services?.price || 0), 0);
  const cashRevenue = completedBookings.filter(b => b.payment_method === 'cash').reduce((sum, b) => sum + (b.services?.price || 0), 0);
  const transferRevenue = completedBookings.filter(b => b.payment_method === 'transfer').reduce((sum, b) => sum + (b.services?.price || 0), 0);

  const totalStoreRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const stats = [
    { 
      label: t('overview.stats.totalBookings'), 
      value: bookings.length, 
      sub: `${pendingBookings.length} ${t('overview.pending')}`,
      icon: Calendar, 
      color: 'blue',
      link: '/dashboard/agenda'
    },
    activeProducts ? { 
      label: t('overview.stats.totalOrders'), 
      value: orders.length, 
      sub: `${pendingOrders.length} ${t('overview.pendingPayment')}`,
      icon: ShoppingBag, 
      color: 'emerald',
      link: '/dashboard/pedidos'
    } : null,
    { 
      label: t('overview.stats.clients'), 
      value: clients.length, 
      sub: t('overview.stats.clientDatabase'),
      icon: Users, 
      color: 'purple',
      link: '/dashboard/clientes'
    },
    activeProducts ? { 
      label: t('overview.stats.storeRevenue'), 
      value: `$${totalStoreRevenue.toFixed(2)}`, 
      sub: t('overview.stats.completedSales'),
      icon: TrendingUp, 
      color: 'amber',
      link: '/dashboard/pedidos'
    } : null,
    { 
      label: t('overview.stats.serviceRevenue'), 
      value: `$${totalServiceRevenue.toFixed(2)}`, 
      sub: t('overview.stats.completedBookings'),
      icon: TrendingUp, 
      color: 'emerald',
      link: '/dashboard/agenda'
    },
  ].filter(Boolean);

  const recentActivity = [
    ...bookings.map(b => ({ ...b, type: 'booking' as const, date: new Date(b.created_at) })),
    ...orders.map(o => ({ ...o, type: 'order' as const, date: new Date(o.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            ¡Hola, {business?.name}!
          </h1>
          {plan && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Crown size={12} />
              {plan.name}
            </span>
          )}
          {isLegacyAdmin && !plan && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <AlertTriangle size={12} />
              {t('overview.plan.legacyTitle')}
            </span>
          )}
        </div>
        <p className="text-gray-400">{t('overview.subtitle')}</p>
      </div>

      {/* Plan info card */}
      {plan && (() => {
        const used = bookings.length;
        const limit = plan.max_bookings_per_month;
        const remaining = limit ? Math.max(0, limit - used) : null;
        const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
        const isLimitReached = limit !== null && used >= limit;
        const isAlmostFull = limit !== null && used >= limit * 0.8 && !isLimitReached;

        return (
          <div className={`rounded-2xl border p-5 ${
            isLimitReached ? 'bg-red-500/5 border-red-500/20' :
            isAlmostFull ? 'bg-amber-500/5 border-amber-500/20' :
            'bg-dark-card border-white/5'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  limit === null ? 'bg-emerald-600/10' :
                  isLimitReached ? 'bg-red-600/10' :
                  isAlmostFull ? 'bg-amber-600/10' : 'bg-blue-600/10'
                }`}>
                  {limit === null ? (
                    <Infinity size={24} className="text-emerald-400" />
                  ) : (
                    <Calendar size={24} className={
                      isLimitReached ? 'text-red-400' :
                      isAlmostFull ? 'text-amber-400' : 'text-blue-400'
                    } />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-400" />
                    <p className="text-white font-bold">{plan.name}</p>
                    {limit !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isLimitReached ? 'bg-red-500/10 text-red-400' :
                        isAlmostFull ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {isLimitReached ? t('overview.plan.limitReached') : `${remaining} ${t('overview.plan.remaining')}`}
                      </span>
                    )}
                    {limit === null && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        {t('overview.plan.unlimited')}
                      </span>
                    )}
                  </div>
                  {limit !== null ? (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-400 text-sm">{t('overview.plan.used')}: <span className="text-white font-semibold">{used}</span></span>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-400 text-sm">{t('overview.plan.remaining')}: <span className={`font-semibold ${
                        isLimitReached ? 'text-red-400' : isAlmostFull ? 'text-amber-400' : 'text-white'
                      }`}>{remaining}</span></span>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-400 text-sm">{t('overview.plan.limit')}: <span className="text-white font-semibold">{limit}</span></span>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">{t('overview.plan.unlimitedDesc')}</p>
                  )}
                </div>
              </div>

              {limit !== null && (
                <div className="flex flex-col items-end gap-2 min-w-[140px]">
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLimitReached ? 'bg-red-500' :
                        isAlmostFull ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(pct)}% {t('overview.plan.used').toLowerCase()}</span>
                </div>
              )}
            </div>

            {/* Limit reached / almost full banner */}
            {isLimitReached && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-red-400 shrink-0" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm">{t('overview.plan.limitReached')}</p>
                    <p className="text-red-300/70 text-xs mt-0.5">{t('overview.plan.limitReachedDesc')}</p>
                  </div>
                </div>
                <Link to="/dashboard/pago" className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0">
                  {t('overview.plan.changePlan')} <ArrowRight size={14} />
                </Link>
              </div>
            )}
            {isAlmostFull && !isLimitReached && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                <p className="text-amber-300 text-sm">
                  {t('overview.plan.almostFull', { remaining: String(remaining) })}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Fallback card for admins without a subscription record */}
      {isLegacyAdmin && (
        <div className="rounded-2xl border bg-dark-card border-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center">
                <Crown size={24} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold">{t('overview.plan.legacyTitle')}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    {t('overview.plan.legacyTitle')}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{t('overview.plan.legacyDesc')}</p>
              </div>
            </div>
            <Link to="/dashboard/pago" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0">
              {t('overview.plan.choosePlan')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Starter plan upgrade prompt */}
      {isStarter && (
        <div className="rounded-2xl border bg-dark-card border-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-lg">{plan?.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{t('overview.plan.starterDesc')}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t('overview.plan.featureUnlimitedBookings')}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t('overview.plan.featureOneProfessional')}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/5 line-through">{t('overview.plan.featureStore')}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/5 line-through">{t('overview.plan.featureArchive')}</span>
              </div>
            </div>
            <Link to="/dashboard/pago" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0 whitespace-nowrap">
              {t('overview.plan.changePlan')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s: any) => (
          <Link 
            key={s.label}
            to={s.link}
            className="bg-dark-card border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
              s.color === 'blue' ? 'bg-blue-600/10 text-blue-400' :
              s.color === 'emerald' ? 'bg-emerald-600/10 text-emerald-400' :
              s.color === 'purple' ? 'bg-purple-600/10 text-purple-400' :
              'bg-amber-600/10 text-amber-400'
            }`}>
              <s.icon size={24} />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{s.value}</h3>
            <p className="text-gray-400 text-xs mt-2">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Payment Method Breakdown */}
      {totalServiceRevenue > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-card border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{t('overview.stats.serviceRevenue')}</p>
            </div>
            <p className="text-xl font-bold text-white">${totalServiceRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-dark-card border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Banknote size={16} className="text-blue-400" />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{t('overview.stats.cash')}</p>
            </div>
            <p className="text-xl font-bold text-white">${cashRevenue.toFixed(2)}</p>
            <p className="text-gray-500 text-xs mt-1">{completedBookings.filter(b => b.payment_method === 'cash').length} {t('overview.stats.payments')}</p>
          </div>
          <div className="bg-dark-card border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center">
                <CreditCard size={16} className="text-purple-400" />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{t('overview.stats.transfer')}</p>
            </div>
            <p className="text-xl font-bold text-white">${transferRevenue.toFixed(2)}</p>
            <p className="text-gray-500 text-xs mt-1">{completedBookings.filter(b => b.payment_method === 'transfer').length} {t('overview.stats.payments')}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Recent Activity */}
        <div className="bg-dark-card border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t('overview.recentActivity')}</h2>
            <Link to={activeProducts ? "/dashboard/pedidos" : "/dashboard/agenda"} className="text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
              {t('overview.viewAll')} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="p-6 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  act.type === 'booking' ? 'bg-blue-600/10 text-blue-400' : 'bg-emerald-600/10 text-emerald-400'
                }`}>
                  {act.type === 'booking' ? <Calendar size={18} /> : <ShoppingBag size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {act.type === 'booking' ? `${t('overview.bookingPrefix')} ${act.services?.name}` : t('overview.orderLabel')}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {act.profiles?.full_name || act.client?.full_name || t('overview.unknownClient')} • {act.date.toLocaleDateString('es-EC')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    act.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                    act.status === 'completed' || act.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="p-10 text-center text-gray-500 italic">{t('overview.noRecentActivity')}</p>
            )}
          </div>
        </div>

        {/* Pending Tasks / Shortcuts */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">{t('overview.quickAccess')}</h3>
              <p className="text-blue-100/80 text-sm mb-6">{t('overview.quickAccessDesc')}</p>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/dashboard/servicios" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex flex-col gap-2">
                  <Clock size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('dashboard.services')}</span>
                </Link>
                {activeProducts && (
                  <Link to="/dashboard/productos" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex flex-col gap-2">
                    <Package size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('overview.products')}</span>
                  </Link>
                )}
              </div>
            </div>
            <TrendingUp size={150} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" />
          </div>

          <div className="bg-dark-card border border-white/5 p-8 rounded-[2.5rem]">
            <h2 className="text-lg font-bold text-white mb-6">{t('overview.pendingToday')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-300">{t('overview.pendingBookings')}</span>
                </div>
                <span className="text-sm font-bold text-white">{pendingBookings.length}</span>
              </div>
              {activeProducts && (
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-300">{t('overview.pendingOrders')}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{pendingOrders.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}