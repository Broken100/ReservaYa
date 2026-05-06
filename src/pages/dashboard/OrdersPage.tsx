import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Loader2, CheckCircle, XCircle, Search, Package, Calendar, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useOrders } from '../../hooks/useOrders';
import { useBusiness } from '../../hooks/useBusiness';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const { orders, loading, updateOrderStatus, archiveOrder } = useOrders({ businessId: business?.id ?? null });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const handleUpdateStatus = async (id: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateOrderStatus(id, status);
    } catch (err: any) {
      toast.error(t('orders.errorUpdate', { message: err.message || 'Inténtelo de nuevo' }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  const filtered = orders.filter(o => {
    const matchesSearch = o.client?.full_name?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag size={24} className="text-blue-500" />
            {t('orders.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('orders.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder={t('orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-card border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-dark-card border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all"
        >
          <option value="all">{t('orders.filter.all')}</option>
          <option value="pending">{t('orders.filter.pending')}</option>
          <option value="completed">{t('orders.filter.completed')}</option>
          <option value="cancelled">{t('orders.filter.cancelled')}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-card rounded-3xl border border-white/5 p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('orders.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className="bg-dark-card border border-white/5 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {order.status === 'pending' && <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/20">{t('orders.status.pending')}</span>}
                    {order.status === 'completed' && <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20">{t('orders.status.completed')}</span>}
                    {order.status === 'cancelled' && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">{t('orders.status.cancelled')}</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{order.client?.full_name || t('orders.client')}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-4">
                    <span>{order.client?.email}</span>
                    <span>{order.client?.phone}</span>
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">{t('orders.totalToCharge')}</p>
                    <p className="text-2xl font-bold text-blue-400">${order.total_amount.toFixed(2)}</p>
                  </div>
                  <span className="bg-white/5 text-gray-400 text-xs px-3 py-1.5 rounded-lg border border-white/5">
                    {t('orders.paymentLabel')}: {order.payment_method === 'cash' ? t('orders.payment.cash') : t('orders.payment.transfer')}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} /> {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-dark-bg rounded-2xl p-4 border border-white/5 space-y-3 mb-6">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-dark-card rounded-lg flex items-center justify-center border border-white/5">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package size={16} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{item.product?.name || t('orders.unknownProduct')}</p>
                        <p className="text-gray-500 text-xs">{item.quantity} x ${item.unit_price.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className="text-white font-bold text-sm">${(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button onClick={async () => {
                  if (window.confirm(t('orders.archiveConfirm'))) {
                    try { await archiveOrder(order.id); } 
                    catch (err: any) { toast.error(err.message); }
                  }
                }} className="px-4 py-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                  <Archive size={16} /> {t('orders.archive')}
                </button>
                {order.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-bold transition-colors">
                      {t('orders.cancel')}
                    </button>
                    <button onClick={() => handleUpdateStatus(order.id, 'completed')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                      <CheckCircle size={16} /> {t('orders.markAsPaid')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
