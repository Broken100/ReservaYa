import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BookingWithClient } from '../../types/database';

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface MonthViewProps {
  bookings: BookingWithClient[];
  year: number;
  month: number;
  selectedDate: string;
  onOpenDetails: (date: string) => void;
}

export default function MonthView({ bookings, year, month, selectedDate, onOpenDetails }: MonthViewProps) {
  const { t } = useTranslation();
  const DAY_HEADERS = t('agenda.days', { returnObjects: true }) as string[];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toLocalDateString(new Date());

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const map: Record<number, BookingWithClient[]> = {};
    for (const b of bookings) {
      const day = parseInt(b.booking_date.split('-')[2], 10);
      if (!map[day]) map[day] = [];
      map[day].push(b);
    }
    return map;
  }, [bookings]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-dark-card rounded-3xl border border-white/5 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {DAY_HEADERS.map(d => (
          <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-600">{d}</div>
        ))}
      </div>
      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="border-b border-r border-white/[0.03] min-h-[100px]" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayBookings = bookingsByDay[day] || [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const pendingCount = dayBookings.filter(b => b.status === 'pending').length;
          const confirmedCount = dayBookings.filter(b => b.status === 'confirmed').length;

          return (
            <button
              key={day}
              onClick={() => onOpenDetails(dateStr)}
              className={`min-h-[100px] border-b border-r border-white/[0.03] p-2 text-left transition-all hover:bg-white/[0.03] group ${isSelected ? 'bg-blue-600/10' : ''}`}
            >
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mb-1 ${
                isToday ? 'bg-blue-600 text-white' : 'text-gray-300 group-hover:text-white'
              }`}>
                {day}
              </span>
              {dayBookings.length > 0 && (
                <div className="space-y-1">
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                      <span className="text-[10px] text-yellow-400 font-medium truncate">{pendingCount} {t('agenda.pendingLabel')}</span>
                    </div>
                  )}
                  {confirmedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <span className="text-[10px] text-green-400 font-medium truncate">{confirmedCount} {t('agenda.confirmedLabel')}</span>
                    </div>
                  )}
                  {dayBookings.length > pendingCount + confirmedCount && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />
                      <span className="text-[10px] text-gray-500 font-medium truncate">{dayBookings.length - pendingCount - confirmedCount} {t('agenda.otherLabel')}</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
