import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../hooks/useBusiness';
import { usePlanGating } from '../../hooks/usePlanGating';
import { useTheme } from '../../hooks/useTheme';
import { Archive, Calendar, LayoutList, Users, UserCheck, Settings, LogOut, Menu, X, Package, Home, Star } from 'lucide-react';
import { useState } from 'react';
import { validateForm, businessSetupSchema } from '../../lib/validation';

// Dynamic nav items are now built inside the component to respect conditional visibility

// Add translation key 'dashboard.products' dynamically if not exist (or just use raw string fallback)

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { profile, signOut, user } = useAuth();
  const { business, loading: businessLoading, error, createBusiness } = useBusiness();
  const { isPro } = usePlanGating(user?.id ?? null);
  const { themeClass, tColor } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupForm, setSetupForm] = useState({ name: '', category: 'Peluquería', customCategory: '', phone: '', city: '' });

  const activeProducts = business?.settings?.enable_products;

  const fullNavItems = [
    { to: '/dashboard', icon: Home, labelKey: 'dashboard.home', end: true },
    { to: '/dashboard/agenda', icon: Calendar, labelKey: 'dashboard.agenda' },
    { to: '/dashboard/pedidos', icon: ({ size = 18, ...props }: { size?: number }) => <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, labelKey: 'dashboard.orders', proOnly: true },
    { to: '/dashboard/clientes', icon: Users, labelKey: 'dashboard.clients' },
    { to: '/dashboard/archivados', icon: Archive, labelKey: 'dashboard.archive', proOnly: true },
    { to: '/dashboard/resenas', icon: Star, labelKey: 'reviews.navLabel', proOnly: false },
    { to: '/dashboard/servicios', icon: LayoutList, labelKey: 'dashboard.services' },
    { to: '/dashboard/productos', icon: Package, labelKey: 'dashboard.products', proOnly: true },
    { to: '/dashboard/profesionales', icon: UserCheck, labelKey: 'dashboard.professionals' },
    { to: '/dashboard/configuracion', icon: Settings, labelKey: 'dashboard.settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[Dashboard] Error during logout:', err);
    } finally {
      navigate('/');
    }
  };

  const handleSetup = async () => {
    const validation = validateForm(businessSetupSchema, setupForm);
    if (!validation.success) {
      const firstError = Object.values(validation.errors!)[0];
      toast.error(firstError);
      return;
    }
    
    setLoading(true);
    const finalCategory = setupForm.category === 'Otro' ? setupForm.customCategory : setupForm.category;
    
    const success = await createBusiness({
      name: setupForm.name,
      category: finalCategory || 'Otro',
      phone: setupForm.phone,
      city: setupForm.city,
      slug: setupForm.name.toLowerCase().replace(/\s+/g, '-'),
    });

    if (!success) {
      setLoading(false);
    }
    // business state will be updated by hook and re-render
  };

  if (businessLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">{t('layout.dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <p className="text-red-400 mb-6 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/5 text-white px-8 py-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
          >
            {t('layout.dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }
  const currentPath = location.pathname.replace(/\/$/, '');
  const isPaymentPage = currentPath === '/dashboard/pago';

  if (!business && !isPaymentPage) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card rounded-[2.5rem] p-10 lg:p-16 border border-white/5 w-full max-w-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Calendar size={200} className="text-blue-600" />
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
              {t('layout.dashboard.setupTitle')}
            </h1>
            <p className="text-gray-400 mb-10 text-lg">{t('layout.dashboard.setupSubtitle')}</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('layout.dashboard.businessName')}</label>
                <input 
                  type="text" 
                  value={setupForm.name}
                  onChange={e => setSetupForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t('layout.dashboard.businessNamePlaceholder')} 
                  className="w-full bg-dark-bg border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('layout.dashboard.category')}</label>
                <select 
                  value={setupForm.category}
                  onChange={e => setSetupForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-dark-bg border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all appearance-none"
                >
                  <option>{t('layout.dashboard.categories.0')}</option>
                  <option>{t('layout.dashboard.categories.1')}</option>
                  <option>{t('layout.dashboard.categories.2')}</option>
                  <option>{t('layout.dashboard.categories.3')}</option>
                  <option value="Otro">{t('layout.dashboard.otherCategory')}</option>
                </select>
              </div>

              {setupForm.category === 'Otro' && (
                <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('layout.dashboard.categoryCustom')}</label>
                  <input 
                    type="text" 
                    onChange={e => setSetupForm(p => ({ ...p, customCategory: e.target.value }))}
                    placeholder={t('layout.dashboard.categoryCustomPlaceholder')} 
                    className="w-full bg-dark-bg border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('layout.dashboard.phone')}</label>
                <input 
                  type="tel" 
                  value={setupForm.phone}
                  onChange={e => setSetupForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder={t('layout.dashboard.phonePlaceholder')} 
                  className="w-full bg-dark-bg border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('layout.dashboard.city')}</label>
                <input 
                  type="text" 
                  value={setupForm.city}
                  onChange={e => setSetupForm(p => ({ ...p, city: e.target.value }))}
                  placeholder={t('layout.dashboard.cityPlaceholder')} 
                  className="w-full bg-dark-bg border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleSetup}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              >
                {t('layout.dashboard.startNow')}
              </button>
              <button 
                onClick={handleSignOut}
                className="px-8 py-5 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all"
              >
                {t('layout.dashboard.signOut')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass} flex`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-dark-card border-r border-white/5 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${tColor.bg} rounded-lg flex items-center justify-center`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-white">ReservaYa</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {fullNavItems.map(({ to, icon: Icon, labelKey, label, end, proOnly }) => {
            const locked = proOnly && !isPro;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    locked ? 'opacity-40 cursor-not-allowed' : ''
                  } ${
                    isActive && !locked
                      ? `${tColor.bgSubtle} ${tColor.text} border ${tColor.borderSubtle}`
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
                onClickCapture={(e) => { if (locked) { e.preventDefault(); toast.info(t('planGating.storeUpgrade')); }}}
              >
                <Icon size={18} />
                {t(labelKey)}
                {proOnly && (
                  <span className="text-[10px] uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full ml-auto">
                    {t('planGating.proFeature')}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className={`w-8 h-8 rounded-full ${tColor.bgSubtle} flex items-center justify-center ${tColor.text} text-sm font-bold`}>
                {profile?.full_name?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-gray-500 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-600/5 transition-all w-full"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-dark-bg">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="text-white font-bold">ReservaYa</span>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
