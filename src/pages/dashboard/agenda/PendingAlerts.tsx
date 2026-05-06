import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { BookingWithClient } from '../../types/database';

function toLocalDate(dateStr: string) {
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d;
}

interface PendingAlertsProps {
  pendingBookings: BookingWithClient[];
  selectedDate: string;
  actionedBookings: Record<string, 'confirmed' | 'cancelled'>;
  onConfirm: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export default function PendingAlerts({ pendingBookings, selectedDate, actionedBookings, onConfirm, onCancel }: PendingAlertsProps) {
  const { t } = useTranslation();
  const visiblePendingBookings = pendingBookings.filter(b => 
    b.booking_date !== selectedDate && (b.status === 'pending' || actionedBookings[b.id])
  );

  if (visiblePendingBookings.length === 0) return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
      <h2 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
        <Clock size={20} />
        {t('agenda.pendingBookingsTitle')} ({visiblePendingBookings.filter(b => b.status === 'pending' && !actionedBookings[b.id]).length})
      </h2>
      <div className="space-y-3">
        {visiblePendingBookings.map((booking) => {
          const action = actionedBookings[booking.id];
          return (
            <div
              key={booking.id}
              className={`rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all duration-500 ${
                action === 'confirmed'
                  ? 'bg-green-600/10 border-green-500/30 scale-[0.98] opacity-80'
                  : action === 'cancelled'
                  ? 'bg-red-600/10 border-red-500/30 scale-[0.98] opacity-80'
                  : 'bg-dark-card border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {action && (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    action === 'confirmed' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {action === 'confirmed'
                      ? <CheckCircle size={18} className="text-green-400" />
                      : <XCircle size={18} className="text-red-400" />
                    }
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">
                    {action
                      ? action === 'confirmed' ? t('agenda.bookingConfirmed') : t('agenda.bookingRejected')
                      : `${toLocalDate(booking.booking_date).toLocaleDateString('es-EC', { weekday: 'long', month: 'long', day: 'numeric' })} a las ${booking.start_time.slice(0, 5)}`
                    }
                  </p>
                  <p className="text-gray-400 text-sm">{booking.services?.name || t('agenda.service')}</p>
                </div>
              </div>
              {!action && (
                <div className="flex gap-2">
                  <button onClick={() => onConfirm(booking.id)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors">{t('agenda.confirm')}</button>
                  <button onClick={() => onCancel(booking.id)} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-bold rounded-lg transition-colors">{t('agenda.reject')}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
