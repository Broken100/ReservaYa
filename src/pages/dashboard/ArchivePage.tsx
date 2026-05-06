import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, RotateCcw, Trash2, Download, Loader2, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useBookings } from '../../hooks/useBookings';
import { useOrders } from '../../hooks/useOrders';
import { useBusiness } from '../../hooks/useBusiness';
import { generateCSV, downloadCSV } from '../../hooks/useExport';
import { supabase } from '../../lib/supabaseClient';

type Tab = 'bookings' | 'orders';

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

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
};

export default function ArchivePage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const [tab, setTab] = useState<Tab>('bookings');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const bookingsHook = useBookings({ businessId: business?.id ?? null, archived: true });
  const ordersHook = useOrders({ businessId: business?.id ?? null, archived: true });

  const bookings = bookingsHook.bookings;
  const orders = ordersHook.orders;
  const bookingsLoading = bookingsHook.loading;
  const ordersLoading = ordersHook.loading;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const items = tab === 'bookings' ? bookings : orders;
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      if (tab === 'bookings') {
        await bookingsHook.restoreBooking(id);
        toast.success(t('archive.restoreSuccess'));
      } else {
        await ordersHook.restoreOrder(id);
        toast.success(t('archive.restoreSuccess'));
      }
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch {
      toast.error(t('archive.restoreSuccess'));
    }
  };

  const handleDeletePermanent = async (id: string) => {
    try {
      setActionLoading(true);
      const table = tab === 'bookings' ? 'bookings' : 'orders';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (tab === 'bookings') {
        bookingsHook.refresh();
      } else {
        ordersHook.refresh();
      }
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success(t('archive.deleteSuccess'));
    } catch {
      toast.error(t('archive.deleteSuccess'));
    } finally {
      setActionLoading(false);
      setDeleteConfirmId(null);
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error(t('archive.noSelection'));
      return;
    }
    setActionLoading(true);
    try {
      for (const id of selectedIds) {
        if (tab === 'bookings') await bookingsHook.restoreBooking(id);
        else await ordersHook.restoreOrder(id);
      }
      toast.success(t('archive.restoreSuccess'));
      setSelectedIds(new Set());
    } catch {
      toast.error(t('archive.restoreSuccess'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error(t('archive.noSelection'));
      return;
    }
    if (!window.confirm(t('archive.deleteConfirm'))) return;
    setActionLoading(true);
    try {
      const table = tab === 'bookings' ? 'bookings' : 'orders';
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from(table).delete().in('id', ids);
      if (error) throw error;
      if (tab === 'bookings') bookingsHook.refresh();
      else ordersHook.refresh();
      toast.success(t('archive.deleteSuccess'));
      setSelectedIds(new Set());
    } catch {
      toast.error(t('archive.deleteSuccess'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const items = tab === 'bookings' ? bookings : orders;
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    if (selectedItems.length === 0 && selectedIds.size === 0) {
      toast.error(t('archive.noSelection'));
      return;
    }
    const dataToExport = selectedItems.length > 0 ? selectedItems : items;

    if (tab === 'bookings') {
      const csv = generateCSV(
        dataToExport as unknown as Record<string, unknown>[],
        [
          { key: 'client_name', label: 'Cliente' },
          { key: 'service_name', label: 'Servicio' },
          { key: 'booking_date', label: 'Fecha' },
          { key: 'start_time', label: 'Hora' },
          { key: 'status', label: 'Estado' },
          { key: 'payment_method', label: 'Método de Pago' },
        ]
      );
      downloadCSV(csv, `reservas-archivadas-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const csv = generateCSV(
        dataToExport as unknown as Record<string, unknown>[],
        [
          { key: 'client_name', label: 'Cliente' },
          { key: 'total_amount', label: 'Total' },
          { key: 'status', label: 'Estado' },
          { key: 'payment_method', label: 'Método de Pago' },
          { key: 'created_at', label: 'Fecha' },
        ]
      );
      downloadCSV(csv, `pedidos-archivados-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };

  const currentItems = tab === 'bookings' ? bookings : orders;
  const loading = tab === 'bookings' ? bookingsLoading : ordersLoading;

  if (loading && currentItems.length === 0) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Archive size={24} className="text-blue-500" />
            {t('archive.title')}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-dark-card rounded-xl border border-white/5 p-1">
        {(['bookings', 'orders'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => { setTab(tabKey); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tabKey ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tabKey === 'bookings' ? t('archive.tabs.bookings') : t('archive.tabs.orders')}
          </button>
        ))}
      </div>

      {currentItems.length === 0 ? (
        <div className="bg-dark-card rounded-3xl border border-white/5 p-12 text-center">
          <Archive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{tab === 'bookings' ? t('archive.empty') : t('archive.emptyOrders')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {selectedIds.size === currentItems.length ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
              {t('archive.selectAll')}
            </button>
            <span className="text-sm text-gray-500">
              {t('archive.selected', { count: selectedIds.size })}
            </span>
          </div>

          <div className="space-y-3">
            {currentItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              const isBooking = tab === 'bookings';
              const booking = isBooking ? item as typeof bookings[number] : null;
              const order = !isBooking ? item as typeof orders[number] : null;

              return (
                <div
                  key={item.id}
                  className={`bg-dark-card border rounded-2xl p-4 transition-all ${isSelected ? 'border-blue-500/40' : 'border-white/5'}`}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSelect(item.id)} className="mt-1 flex-shrink-0">
                      {isSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} className="text-gray-500" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {isBooking ? booking?.client?.full_name || t('agenda.client') : order?.client?.full_name || t('orders.client')}
                          </p>
                          {isBooking && booking && (
                            <p className="text-gray-400 text-xs mt-0.5">{booking.services?.name || t('agenda.service')}</p>
                          )}
                          {!isBooking && order && (
                            <p className="text-blue-400 text-sm font-bold mt-0.5">${order.total_amount.toFixed(2)}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[item.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                            {STATUS_LABELS[item.status] || item.status}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {isBooking && booking ? `${booking.booking_date} ${booking.start_time?.slice(0, 5)}` : order ? new Date(order.created_at).toLocaleDateString() : ''}
                          </span>
                          <span className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded">
                            {PAYMENT_LABELS[item.payment_method] || item.payment_method}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="px-3 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} /> {t('archive.restore')}
                    </button>
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 text-xs">{t('archive.deleteConfirm')}</span>
                        <button
                          onClick={() => handleDeletePermanent(item.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          {actionLoading ? t('archive.deleting') : t('archive.deletePermanent')}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={14} /> {t('archive.deletePermanent')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark-card border border-white/10 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-4 z-50">
              <span className="text-white text-sm font-medium">{t('archive.selected', { count: selectedIds.size })}</span>
              <button
                onClick={handleRestoreSelected}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw size={14} /> {actionLoading ? t('archive.restoring') : t('archive.restoreSelected')}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={14} /> {actionLoading ? t('archive.deleting') : t('archive.deleteSelected')}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <Download size={14} /> {t('archive.exportCSV')}
              </button>
            </div>
          )}
        </>
      )}

      {currentItems.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
          >
            <Download size={16} /> {t('archive.export')}
          </button>
        </div>
      )}
    </div>
  );
}