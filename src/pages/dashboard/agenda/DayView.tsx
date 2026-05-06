import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, CheckCircle, XCircle, Phone, Archive } from 'lucide-react';
import type { BookingWithClient } from '../../types/database';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

interface DayViewProps {
  bookings: BookingWithClient[];
  confirmBooking: (id: string) => void;
  cancelBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  archiveBooking: (id: string) => void;
}

export default function DayView({ bookings, confirmBooking, cancelBooking, completeBooking, archiveBooking }: DayViewProps) {
  const { t } = useTranslation();

  const STATUS_LABELS: Record<string, string> = {
    pending: t('agenda.status.pending'),
    confirmed: t('agenda.status.confirmed'),
    cancelled: t('agenda.status.cancelled'),
    completed: t('agenda.status.completed'),
  };
  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 bg-dark-card rounded-3xl border border-white/5">
        <Calendar size={48} className="text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500">{t('agenda.noBookingsForDate')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-dark-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-5">
            <div className="bg-white/5 p-3 rounded-xl shrink-0 mt-1">
              <Clock size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</p>
              
              {/* Client Info */}
              <div className="flex items-center gap-3 mb-2">
                {booking.client?.avatar_url ? (
                  <img src={booking.client.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-[10px] font-bold">
                    {(booking.client?.full_name || '?')[0]}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-300">{booking.client?.full_name || t('agenda.client')}</span>
                {booking.client?.phone && (
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {booking.client.phone}</span>
                )}
              </div>

              <p className="text-gray-500 text-sm flex gap-2 items-center">
                <span className="text-blue-400/80">{booking.services?.name || t('agenda.service')}</span>
              </p>
              {booking.notes && (
                <p className="text-xs text-gray-400 italic mt-2">"{booking.notes}"</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${STATUS_STYLES[booking.status] || ''}`}>
              {STATUS_LABELS[booking.status] || booking.status}
            </span>
            <div className="flex gap-1">
              <button onClick={async () => {
                if (window.confirm(t('agenda.archiveConfirm'))) {
                  try { await archiveBooking(booking.id); } catch(e) {}
                }
              }} className="p-2 rounded-lg hover:bg-gray-600/10 text-gray-500 hover:text-gray-400 transition-colors" title={t('agenda.archive')}>
                <Archive size={18} />
              </button>
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <>
                  {booking.status === 'pending' && (
                    <button onClick={() => confirmBooking(booking.id)} className="p-2 rounded-lg hover:bg-green-600/10 text-gray-500 hover:text-green-400 transition-colors" title={t('agenda.confirm')}>
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => completeBooking(booking.id)} className="p-2 rounded-lg hover:bg-blue-600/10 text-gray-500 hover:text-blue-400 transition-colors" title={t('agenda.complete')}>
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => cancelBooking(booking.id)} className="p-2 rounded-lg hover:bg-red-600/10 text-gray-500 hover:text-red-400 transition-colors" title={t('agenda.cancel')}>
                    <XCircle size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
