import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import type { BusinessHours } from '../../../types/database';

interface HoursSectionProps {
  localHours: Pick<BusinessHours, 'day_of_week' | 'open_time' | 'close_time' | 'is_closed'>[];
  onUpdateDay: (dayIndex: number, field: string, value: string | boolean) => void;
}

export default function HoursSection({ localHours, onUpdateDay }: HoursSectionProps) {
  const { t } = useTranslation();
  const days = t('settings.days', { returnObjects: true }) as unknown as string[];

  return (
    <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-10 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
          <Clock size={20} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{t('settings.hoursTitle')}</h2>
      </div>

      <div className="space-y-4">
        {localHours.map((h) => (
          <div key={h.day_of_week} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${h.is_closed ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-dark-bg border-white/5'}`}>
            <div className="w-28">
              <span className="text-sm font-semibold text-white">{days[h.day_of_week]}</span>
            </div>
            
            <div className="flex items-center gap-4 flex-1">
              {!h.is_closed ? (
                <>
                  <input 
                    type="time" 
                    value={h.open_time.slice(0, 5)} 
                    onChange={e => onUpdateDay(h.day_of_week, 'open_time', e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500/50 outline-none" 
                  />
                  <span className="text-gray-600">a</span>
                  <input 
                    type="time" 
                    value={h.close_time.slice(0, 5)} 
                    onChange={e => onUpdateDay(h.day_of_week, 'close_time', e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500/50 outline-none" 
                  />
                </>
              ) : (
                <span className="text-sm text-gray-500 font-medium italic">{t('settings.closed')}</span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
              <input 
                type="checkbox" 
                checked={h.is_closed} 
                onChange={e => onUpdateDay(h.day_of_week, 'is_closed', e.target.checked)}
                id={`closed-${h.day_of_week}`}
                className="accent-blue-600" 
              />
              <label htmlFor={`closed-${h.day_of_week}`} className="text-xs font-bold text-gray-400 cursor-pointer">{t('settings.closedLabel')}</label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
