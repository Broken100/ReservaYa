import { useTranslation } from 'react-i18next';
import { Clock, X, Loader2, Calendar, Star, ChevronDown, ChevronUp, MessageSquare, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import { useOrders } from '../../hooks/useOrders';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUS_PRIORITY: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

type SortMode = 'priority' | 'date_asc' | 'date_desc';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function MyBookingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bookings, loading: bookingsLoading, cancelBooking } = useBookings({ clientId: user?.id });
  const { orders, loading: ordersLoading, updateOrderStatus } = useOrders({ clientId: user?.id });
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders'>('bookings');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const statusLabels: Record<string, string> = {
    pending: t('myBookings.status.pending'),
    confirmed: t('myBookings.status.confirmed'),
    cancelled: t('myBookings.status.cancelled'),
    completed: t('myBookings.status.completed'),
  };

  // Feedback state
  const [feedbackTarget, setFeedbackTarget] = useState<{ id: string; type: 'booking' | 'order'; currentRating?: number; currentReview?: string } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  const handleCancel = async (id: string) => {
    if (window.confirm(t('client.cancelConfirm') || '¿Estás seguro de que deseas cancelar esta reserva?')) {
      try {
        await cancelBooking(id);
        toast.success(t('client.cancelSuccess') || 'Reserva cancelada correctamente.');
      } catch (err: any) {
        toast.error(t('myBookings.errorCancel') + ': ' + (err.message || 'Inténtelo de nuevo'));
      }
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (window.confirm(t('myBookings.cancelOrderConfirm'))) {
      try {
        await updateOrderStatus(id, 'cancelled');
        toast.success(t('myBookings.cancelOrderSuccess'));
      } catch (err: any) {
        toast.error(t('myBookings.errorCancel') + ': ' + (err.message || 'Inténtelo de nuevo'));
      }
    }
  };

  const openFeedback = (id: string, type: 'booking' | 'order', rating?: number | null, review?: string | null) => {
    setFeedbackTarget({ id, type, currentRating: rating ?? undefined, currentReview: review ?? undefined });
    setFeedbackRating(rating || 0);
    setFeedbackText(review || '');
  };

  const submitFeedback = async () => {
    if (!feedbackTarget || feedbackRating === 0) return;
    setFeedbackSaving(true);
    try {
      const table = feedbackTarget.type === 'booking' ? 'bookings' : 'orders';
      const { error } = await supabase
        .from(table)
        .update({ rating: feedbackRating, review: feedbackText || null })
        .eq('id', feedbackTarget.id);
      if (error) throw error;
      toast.success(t('myBookings.feedback.thanks'));
      setFeedbackTarget(null);
      // Force re-fetch by reloading — in production you'd update local state
      window.location.reload();
    } catch (err: any) {
      toast.error(t('myBookings.feedback.error') + ': ' + (err.message || 'Inténtelo de nuevo'));
    } finally {
      setFeedbackSaving(false);
    }
  };

  // Sort and filter bookings
  const sortedBookings = [...bookings]
    .filter(b => statusFilter === 'all' || b.status === statusFilter)
    .sort((a, b) => {
      if (sortMode === 'priority') return (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9);
      if (sortMode === 'date_asc') return a.booking_date.localeCompare(b.booking_date);
      return b.booking_date.localeCompare(a.booking_date);
    });

  const sortedOrders = [...orders]
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .sort((a, b) => {
      if (sortMode === 'priority') return (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9);
      if (sortMode === 'date_asc') return a.created_at.localeCompare(b.created_at);
      return b.created_at.localeCompare(a.created_at);
    });

  if (bookingsLoading || ordersLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">{t('myBookings.title')}</h1>
        <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => { setActiveTab('bookings'); setStatusFilter('all'); }}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            {t('myBookings.tabs.bookings')}
          </button>
          <button 
            onClick={() => { setActiveTab('orders'); setStatusFilter('all'); }}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            {t('myBookings.tabs.orders')}
          </button>
        </div>
      </div>

      {/* Filters & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap flex-1">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-dark-card text-gray-400 border-white/5 hover:border-white/20'
              }`}
            >
              {s === 'all' ? t('myBookings.filter.all') : statusLabels[s]}
            </button>
          ))}
        </div>
        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
          className="bg-dark-card border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-blue-500/50"
        >
          <option value="priority">{t('myBookings.sort.priority')}</option>
          <option value="date_desc">{t('myBookings.sort.dateDesc')}</option>
          <option value="date_asc">{t('myBookings.sort.dateAsc')}</option>
        </select>
      </div>

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        sortedBookings.length === 0 ? (
          <div className="bg-dark-card rounded-3xl p-12 border border-white/5 text-center shadow-xl">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-gray-400 text-lg mb-6">{statusFilter !== 'all' ? t('myBookings.noBookingsWithStatus') : (t('client.noBookings') || 'No tienes reservas.')}</p>
            <Link 
              to="/cliente/explorar" 
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              {t('client.explore')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBookings.map((b: any) => {
              const isExpanded = expandedId === b.id;
              return (
                <div key={b.id} className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-white/10">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    className="w-full p-5 flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="bg-white/5 p-3 rounded-xl shrink-0 hidden sm:block">
                        <Clock size={18} className="text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold truncate">{b.services?.name || t('myBookings.service')}</p>
                        <p className="text-blue-400 text-sm font-medium">{b.businesses?.name || t('myBookings.business')}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                          <Calendar size={12} />
                          {new Date(`${b.booking_date}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'short', month: 'short', day: 'numeric' })} · {b.start_time.substring(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {b.rating && (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                          <Star size={12} fill="currentColor" />{b.rating}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${statusStyles[b.status]}`}>
                        {statusLabels[b.status]}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 space-y-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('myBookings.service')}</p>
                          <p className="text-white text-sm font-medium">{b.services?.name || '—'}</p>
                        </div>
                        <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('myBookings.professional')}</p>
                          <p className="text-white text-sm font-medium">{b.professionals?.name || t('myBookings.unassigned')}</p>
                        </div>
                        <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('myBookings.schedule')}</p>
                          <p className="text-white text-sm font-medium">{b.start_time?.substring(0, 5)} — {b.end_time?.substring(0, 5)}</p>
                        </div>
                      </div>

                      {b.notes && (
                        <div className="bg-white/5 p-3 rounded-xl">
                          <p className="text-gray-400 text-xs italic">"{b.notes}"</p>
                        </div>
                      )}

                      {/* Existing review */}
                      {b.rating && (
                        <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                          <div className="flex items-center gap-1 mb-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={14} className={s <= b.rating ? 'text-yellow-400' : 'text-gray-600'} fill={s <= b.rating ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                          {b.review && <p className="text-gray-400 text-xs mt-1">"{b.review}"</p>}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <X size={14} /> {t('myBookings.cancelBooking')}
                          </button>
                        )}
                        {b.status === 'completed' && !b.rating && (
                          <button
                            onClick={() => openFeedback(b.id, 'booking', b.rating, b.review)}
                            className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Star size={14} /> {t('myBookings.leaveReview')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        sortedOrders.length === 0 ? (
          <div className="bg-dark-card rounded-3xl p-12 border border-white/5 text-center shadow-xl">
            <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-400 text-lg mb-6">{statusFilter !== 'all' ? t('myBookings.noOrdersWithStatus') : t('myBookings.noOrders')}</p>
            <Link 
              to="/cliente/explorar" 
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
            >
              {t('myBookings.exploreStores')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOrders.map(o => {
              const isExpanded = expandedId === o.id;
              return (
                <div key={o.id} className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-white/10">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    className="w-full p-5 flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="bg-white/5 p-3 rounded-xl shrink-0 hidden sm:block">
                        <Package size={18} className="text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-blue-400 font-medium text-sm">{o.business?.name || t('myBookings.store')}</p>
                        <p className="text-white font-semibold">{o.items.length} producto{o.items.length !== 1 ? 's' : ''} · <span className="text-blue-400">${o.total_amount.toFixed(2)}</span></p>
                        <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                          <Calendar size={12} />
                          {new Date(o.created_at).toLocaleDateString('es-EC', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {o.rating && (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                          <Star size={12} fill="currentColor" />{o.rating}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${statusStyles[o.status]}`}>
                        {statusLabels[o.status]}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 space-y-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-3 mt-4">
                        {o.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.product?.image_url ? (
                                <img src={item.product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center"><Package size={14} className="text-gray-500" /></div>
                              )}
                              <div>
                                <p className="text-white text-sm font-medium">{item.product?.name || 'Producto'}</p>
                                <p className="text-gray-500 text-xs">{item.quantity} x ${item.unit_price.toFixed(2)}</p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-sm">${(item.unit_price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('booking.cart.paymentMethod')}</p>
                          <p className="text-white text-sm font-medium">{o.payment_method === 'cash' ? t('myBookings.payment.cash') : t('myBookings.payment.transfer')}</p>
                        </div>
                        <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('booking.price')}</p>
                          <p className="text-blue-400 text-sm font-bold">${o.total_amount.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Existing review */}
                      {o.rating && (
                        <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                          <div className="flex items-center gap-1 mb-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={14} className={s <= o.rating! ? 'text-yellow-400' : 'text-gray-600'} fill={s <= o.rating! ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                          {o.review && <p className="text-gray-400 text-xs mt-1">"{o.review}"</p>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {o.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(o.id)}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <X size={14} /> {t('myBookings.cancelOrder')}
                          </button>
                        )}
                        {o.status === 'completed' && !o.rating && (
                          <button
                            onClick={() => openFeedback(o.id, 'order', o.rating, o.review)}
                            className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Star size={14} /> {t('myBookings.leaveReview')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Feedback Modal ─────────────────────────────── */}
      {feedbackTarget && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setFeedbackTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-dark-card border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{t('myBookings.feedback.title')}</h3>
                  <p className="text-gray-500 text-sm">{t('myBookings.feedback.subtitle')}</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-2 mb-6 justify-center">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    onClick={() => setFeedbackRating(s)}
                    className="transition-transform hover:scale-125"
                  >
                    <Star
                      size={32}
                      className={s <= feedbackRating ? 'text-yellow-400' : 'text-gray-600'}
                      fill={s <= feedbackRating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
              {feedbackRating > 0 && (
                <p className="text-center text-yellow-400 text-sm font-medium mb-4">
                  {feedbackRating === 1 ? t('myBookings.feedback.rating.1') : feedbackRating === 2 ? t('myBookings.feedback.rating.2') : feedbackRating === 3 ? t('myBookings.feedback.rating.3') : feedbackRating === 4 ? t('myBookings.feedback.rating.4') : t('myBookings.feedback.rating.5')}
                </p>
              )}

              {/* Review Text */}
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                rows={3}
                placeholder={t('myBookings.feedback.placeholder')}
                className="w-full bg-dark-bg border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setFeedbackTarget(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  {t('myBookings.feedback.cancel')}
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={feedbackRating === 0 || feedbackSaving}
                  className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {feedbackSaving ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                  {t('myBookings.feedback.send')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
