import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useAvailability, TimeSlot } from '../../hooks/useAvailability';
import { useTranslation } from 'react-i18next';

interface AvailabilityCalendarProps {
  businessId: string;
  serviceId: string;
  professionalId: string | null;
  onSelectTime: (date: Date, time: string) => void;
  onBack: () => void;
  tColor?: any;
}

export default function AvailabilityCalendar({
  businessId,
  serviceId,
  professionalId,
  onSelectTime,
  onBack,
  tColor = { bg: 'bg-blue-600', text: 'text-blue-500', bgSubtle: 'bg-blue-600/10', bgSubtleHover: 'hover:bg-blue-600/20', borderSubtle: 'border-blue-500/50' }
}: AvailabilityCalendarProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { slots, loading, error } = useAvailability(businessId, serviceId, professionalId, selectedDate);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const selectDate = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(currentYear, currentMonth, day);
    return dateToCheck < today;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate();
  };

  const monthNames = (t('agenda.months', { returnObjects: true }) as unknown as string[]) || [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="bg-dark-card rounded-3xl p-8 border border-white/5">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">{t('booking.selectDateTime')}</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">{monthNames[currentMonth]} {currentYear}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400">
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {((t('agenda.daysShort', { returnObjects: true }) as unknown as string[]) || ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']).map(d => (
              <div key={d} className="text-xs text-gray-500 font-medium py-2">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => (
              <div key={i} className="aspect-square">
                {day ? (
                  <button
                    disabled={isPastDate(day)}
                    onClick={() => selectDate(day)}
                    className={`w-full h-full rounded-full flex items-center justify-center text-sm font-medium transition-colors
                      ${isPastDate(day) ? 'text-gray-700 cursor-not-allowed' : 
                        isSelected(day) ? `${tColor.bg} text-white` : 
                        isToday(day) ? `${tColor.bgSubtle} ${tColor.text} ${tColor.bgSubtleHover}` : 
                        'text-gray-300 hover:bg-white/5'}
                    `}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Clock size={16} className={tColor.text} />
            {t('booking.availableTimes')}
          </h3>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Loader2 className={`w-6 h-6 animate-spin ${tColor.text} mb-2`} />
              <p className="text-sm">{t('booking.searchingAvailability')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-red-400 bg-red-500/10 rounded-xl p-4 text-center">
              <p className="text-sm">{t('booking.loadError')}</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center px-4">
              <p className="text-sm">{t('booking.noAvailabilityForDate')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {slots.map((slot, i) => (
                <button
                  key={i}
                  disabled={!slot.available}
                  onClick={() => onSelectTime(selectedDate, slot.time)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors
                    ${slot.available 
                      ? `border-white/10 text-white hover:${tColor.borderSubtle} ${tColor.bgSubtle}` 
                      : 'border-white/5 text-gray-600 bg-white/5 cursor-not-allowed'}
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
