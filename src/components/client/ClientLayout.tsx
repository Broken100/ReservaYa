import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, Search, User, LogOut, CalendarCheck } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/cliente/explorar', icon: Search, labelKey: 'client.explore', fallbackLabel: 'Explorar' },
  { to: '/cliente/reservas', icon: Calendar, labelKey: 'nav.myBookings', fallbackLabel: 'Mis Reservas' },
  { to: '/cliente/perfil', icon: User, labelKey: 'client.profileTitle', fallbackLabel: 'Mi Perfil' },
];

export default function ClientLayout() {
  const { t } = useTranslation();
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const [showSetup, setShowSetup] = useState(!profile?.phone);
  const [setupForm, setSetupForm] = useState({ full_name: profile?.full_name || '', phone: '' });
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[Client] Error during logout:', err);
    } finally {
      navigate('/');
    }
  };

  const handleSetup = async () => {
    if (!setupForm.phone) return toast.error(t('client.errorPhoneRequired'));
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: setupForm.full_name,
          phone: setupForm.phone 
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      toast.error(t('client.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  // Client Onboarding
  if (profile && !profile.phone && showSetup) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card rounded-[2.5rem] p-10 border border-white/5 w-full max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-8 mx-auto">
            <CalendarCheck size={32} className="text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">{t('client.welcome')}</h1>
          <p className="text-gray-400 text-center mb-10">{t('client.welcomeDesc')}</p>
          
          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('client.fullName')}</label>
              <input 
                type="text" 
                value={setupForm.full_name}
                onChange={e => setSetupForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full bg-dark-bg border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('client.whatsappPhone')}</label>
              <input 
                type="tel" 
                placeholder={t('client.phonePlaceholder')}
                value={setupForm.phone}
                onChange={e => setSetupForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full bg-dark-bg border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleSetup}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? t('client.saving') : t('client.completeRegistration')}
          </button>
          
          <button 
            onClick={handleSignOut}
            className="w-full mt-4 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            {t('client.signOut')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-dark-card sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/cliente/explorar" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-white hidden sm:block">ReservaYa</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={16} />
                <span>{t(item.labelKey) || item.fallbackLabel}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {profile?.full_name?.substring(0, 1).toUpperCase() || 'C'}
            </div>
            <span className="text-gray-300 text-sm font-medium">{profile?.full_name}</span>
          </div>
          <button 
            onClick={handleSignOut} 
            className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-xl hover:bg-white/5"
            title={t('nav.logout')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Navigation (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-dark-card z-50 pb-safe">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-xl min-w-[4rem] transition-all ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{t(item.labelKey) || item.fallbackLabel}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
