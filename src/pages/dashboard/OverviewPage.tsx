import { useTranslation } from 'react-i18next';
import { Calendar, Package, Users, TrendingUp, Clock, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useBusiness } from '../../hooks/useBusiness';
import { useBookings } from '../../hooks/useBookings';
import { useOrders } from '../../hooks/useOrders';
import { useClients } from '../../hooks/useClients';
import { Link } from 'react-router-dom';

export default function OverviewPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const activeProducts = (business?.settings as any)?.enable_products;

  // Data fetching
  const { bookings, loading: bookingsLoading } = useBookings({ businessId: business?.id ?? null });
  const { orders, loading: ordersLoading } = useOrders({ businessId: business?.id ?? null });
  const { clients, loading: clientsLoading } = useClients(business?.id ?? null);

  if (bookingsLoading || (activeProducts && ordersLoading) || clientsLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const stats = [
    { 
      label: 'Reservas Totales', 
      value: bookings.length, 
      sub: `${pendingBookings.length} pendientes`,
      icon: Calendar, 
      color: 'blue',
      link: '/dashboard/agenda'
    },
    activeProducts ? { 
      label: 'Pedidos Totales', 
      value: orders.length, 
      sub: `${pendingOrders.length} por cobrar`,
      icon: ShoppingBag, 
      color: 'emerald',
      link: '/dashboard/pedidos'
    } : null,
    { 
      label: 'Clientes', 
      value: clients.length, 
      sub: 'Base de datos',
      icon: Users, 
      color: 'purple',
      link: '/dashboard/clientes'
    },
    activeProducts ? { 
      label: 'Ingresos (Tienda)', 
      value: `$${totalRevenue.toFixed(2)}`, 
      sub: 'Ventas completadas',
      icon: TrendingUp, 
      color: 'amber',
      link: '/dashboard/pedidos'
    } : null,
    { 
      label: 'Ingresos por Servicios', 
      value: `$${bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').reduce((sum, b) => sum + (b.services?.price || 0), 0).toFixed(2)}`, 
      sub: 'Reservas completadas/confirmadas',
      icon: TrendingUp, 
      color: 'emerald',
      link: '/dashboard/agenda'
    },
  ].filter(Boolean);

  // Recent Activity Feed
  const recentActivity = [
    ...bookings.map(b => ({ ...b, type: 'booking', date: new Date(b.created_at) })),
    ...orders.map(o => ({ ...o, type: 'order', date: new Date(o.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          ¡Hola, {business?.name}!
        </h1>
        <p className="text-gray-400">Aquí tienes un resumen de lo que está pasando en tu negocio hoy.</p>
      </div>

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

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Recent Activity */}
        <div className="bg-dark-card border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Actividad Reciente</h2>
            <Link to={activeProducts ? "/dashboard/pedidos" : "/dashboard/agenda"} className="text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
              Ver todo <ChevronRight size={14} />
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
                    {act.type === 'booking' ? `Reserva: ${act.services?.name}` : `Pedido`}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {act.profiles?.full_name || act.client?.full_name || 'Cliente desconocido'} • {act.date.toLocaleDateString('es-EC')}
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
              <p className="p-10 text-center text-gray-500 italic">No hay actividad reciente.</p>
            )}
          </div>
        </div>

        {/* Pending Tasks / Shortcuts */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Acceso Rápido</h3>
              <p className="text-blue-100/80 text-sm mb-6">Gestiona tus servicios y productos fácilmente.</p>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/dashboard/servicios" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex flex-col gap-2">
                  <Clock size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">Servicios</span>
                </Link>
                {activeProducts && (
                  <Link to="/dashboard/productos" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex flex-col gap-2">
                    <Package size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">Productos</span>
                  </Link>
                )}
              </div>
            </div>
            <TrendingUp size={150} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" />
          </div>

          <div className="bg-dark-card border border-white/5 p-8 rounded-[2.5rem]">
            <h2 className="text-lg font-bold text-white mb-6">Pendientes de Hoy</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-300">Reservas por confirmar</span>
                </div>
                <span className="text-sm font-bold text-white">{pendingBookings.length}</span>
              </div>
              {activeProducts && (
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-300">Pedidos pendientes</span>
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
