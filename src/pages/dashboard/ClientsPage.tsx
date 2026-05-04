import { useTranslation } from 'react-i18next';
import { Search, Mail, Phone, Loader2, X, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useBusiness } from '../../hooks/useBusiness';
import { useBookings } from '../../hooks/useBookings';
import { useOrders } from '../../hooks/useOrders';
import { useState } from 'react';

export default function ClientsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const { clients, loading } = useClients(business?.id ?? null);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const filtered = clients.filter(c =>
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">{t('dashboard.clients')}</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="bg-dark-card border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">{search ? 'No se encontraron resultados' : 'Aún no tienes clientes'}</p>
        </div>
      ) : (
        <div className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-600">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-600">Contacto</th>
                <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-600">Reservas</th>
                {(business?.settings as any)?.enable_products && (
                  <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-600">Pedidos</th>
                )}
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-600">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {client.avatar_url ? (
                        <img src={client.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                          {(client.full_name || '?')[0]}
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{client.full_name || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs"><Mail size={12} />{client.email}</span>
                      {client.phone && <span className="flex items-center gap-1.5 text-gray-400 text-xs"><Phone size={12} />{client.phone}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-300 text-sm font-medium bg-white/5 px-3 py-1 rounded-lg">{client.booking_count}</span>
                  </td>
                  {(business?.settings as any)?.enable_products && (
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-300 text-sm font-medium bg-white/5 px-3 py-1 rounded-lg">{client.order_count}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {client.last_activity ? new Date(client.last_activity + 'T12:00:00').toLocaleDateString('es-EC') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over panel */}
      {selectedClient && business && (
        <ClientDetailsPanel 
          client={selectedClient} 
          businessId={business.id} 
          onClose={() => setSelectedClient(null)} 
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── Client Details Panel ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function ClientDetailsPanel({ client, businessId, onClose }: { client: any, businessId: string, onClose: () => void }) {
  const { business } = useBusiness();
  const activeProducts = (business?.settings as any)?.enable_products;
  const { bookings, loading: bookingsLoading } = useBookings({ businessId, clientId: client.id });
  const { orders, loading: ordersLoading } = useOrders({ businessId, clientId: client.id });
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
  };

  const filteredBookings = bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter);
  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between bg-dark-card">
          <div className="flex items-center gap-4">
            {client.avatar_url ? (
              <img src={client.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xl font-bold">
                {(client.full_name || '?')[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{client.full_name || 'Sin nombre'}</h2>
              <div className="flex flex-col gap-1 mt-1">
                <span className="flex items-center gap-1.5 text-gray-400 text-sm"><Mail size={14} />{client.email}</span>
                {client.phone && <span className="flex items-center gap-1.5 text-gray-400 text-sm"><Phone size={14} />{client.phone}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Compact summary line */}
        <div className="px-6 py-3 border-b border-white/10 bg-dark-card/50 flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            {bookings.length} reserva{bookings.length !== 1 ? 's' : ''}
            {activeProducts && ` · ${orders.length} pedido${orders.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Tab toggle */}
        {activeProducts ? (
          <div className="flex bg-black/20 p-1 mx-6 mt-4 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Reservas ({bookings.length})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Pedidos ({orders.length})
            </button>
          </div>
        ) : (
          <div className="px-6 mt-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Historial de Reservas</h3>
          </div>
        )}

        {/* Status Filter Pills */}
        {activeTab === 'bookings' && (
          <div className="flex gap-2 px-6 mt-4 flex-wrap">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setBookingFilter(s)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  bookingFilter === s
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-dark-card text-gray-500 border-white/5 hover:border-white/20'
                }`}
              >
                {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="flex gap-2 px-6 mt-4 flex-wrap">
            {(['all', 'pending', 'completed', 'cancelled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setOrderFilter(s)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  orderFilter === s
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-dark-card text-gray-500 border-white/5 hover:border-white/20'
                }`}
              >
                {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {/* History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeTab === 'bookings' && (
            bookingsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : filteredBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-10">{bookingFilter !== 'all' ? 'No hay reservas con este estado.' : 'Este cliente no tiene reservas.'}</p>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map(booking => (
                  <div key={booking.id} className="bg-dark-card border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[booking.status]}`}>
                        {STATUS_LABELS[booking.status]}
                      </span>
                      <span className="text-gray-500 text-xs font-mono">#{booking.id.slice(0, 8)}</span>
                    </div>
                    
                    <div>
                      <p className="text-white font-medium">{booking.services?.name || 'Servicio'}</p>
                      <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(`${booking.booking_date}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })} • {booking.start_time.slice(0, 5)}
                      </p>
                    </div>
                    
                    {booking.notes && (
                      <div className="bg-white/5 p-3 rounded-xl">
                        <p className="text-gray-400 text-xs italic">"{booking.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'orders' && (
            ordersLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-10">{orderFilter !== 'all' ? 'No hay pedidos con este estado.' : 'Este cliente no ha realizado compras.'}</p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(o => (
                  <div key={o.id} className="bg-dark-card border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                      <span className="text-gray-500 text-xs font-mono">#{o.id.slice(0, 8)}</span>
                    </div>
                    
                    <div className="bg-dark-bg p-3 rounded-xl border border-white/5 space-y-2">
                      {o.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{item.product?.name} x{item.quantity}</span>
                          <span className="text-gray-500 text-xs">${(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('es-EC')}</span>
                      <span className="text-blue-400 font-bold">${o.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
