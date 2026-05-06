import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BookingWithClient } from '../../types/database';

interface YearViewProps {
  bookings: BookingWithClient[];
  year: number;
  onOpenDetails: (month: number) => void;
}

export default function YearView({ bookings, year, onOpenDetails }: YearViewProps) {
  const { t } = useTranslation();
  const MONTH_NAMES = t('agenda.months', { returnObjects: true }) as string[];
  const todayMonth = new Date().getMonth();
  const todayYear = new Date().getFullYear();

  // Group bookings by month
  const bookingsByMonth = useMemo(() => {
    const map: Record<number, { total: number; pending: number; confirmed: number; completed: number; cancelled: number }> = {};
    for (let m = 0; m < 12; m++) map[m] = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const b of bookings) {
      const m = parseInt(b.booking_date.split('-')[1], 10) - 1;
      if (map[m]) {
        map[m].total++;
        if (b.status === 'pending') map[m].pending++;
        else if (b.status === 'confirmed') map[m].confirmed++;
        else if (b.status === 'completed') map[m].completed++;
        else if (b.status === 'cancelled') map[m].cancelled++;
      }
    }
    return map;
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {MONTH_NAMES.map((name, i) => {
        const data = bookingsByMonth[i];
        const isCurrent = i === todayMonth && year === todayYear;
        const maxCount = Math.max(...Object.values(bookingsByMonth).map(d => d.total), 1);
        const barWidth = data.total > 0 ? Math.max((data.total / maxCount) * 100, 8) : 0;

        return (
          <button
            key={name}
            onClick={() => onOpenDetails(i)}
            className={`bg-dark-card rounded-2xl p-5 border transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 text-left group ${
              isCurrent ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-bold ${isCurrent ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'} transition-colors`}>
                {name}
              </span>
              <span className="text-2xl font-bold text-white">{data.total}</span>
            </div>

            {/* Activity bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>

            {/* Status breakdown */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {data.confirmed > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />{data.confirmed}
                </span>
              )}
              {data.pending > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-yellow-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{data.pending}
                </span>
              )}
              {data.completed > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{data.completed}
                </span>
              )}
              {data.cancelled > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{data.cancelled}
                </span>
              )}
              {data.total === 0 && <span className="text-[10px] text-gray-600">{t('agenda.noBookings')}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
