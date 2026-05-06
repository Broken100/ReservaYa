import { useTranslation } from 'react-i18next';
import { Clock, ChevronRight } from 'lucide-react';
import type { Service } from '../../../types/database';

interface ThemeColor {
  text: string;
  border: string;
  borderSubtle: string;
  bgSubtleHover: string;
}

interface ServiceStepProps {
  services: Service[];
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  isMinimal: boolean;
  tColor: ThemeColor;
  onSelect: (service: Service) => void;
}

export default function ServiceStep({ services, textClass, textMutedClass, cardClass, isMinimal, tColor, onSelect }: ServiceStepProps) {
  const { t } = useTranslation();

  return (
    <div className={`${cardClass} rounded-3xl p-8`}>
      <h2 className={`text-xl font-bold ${textClass} mb-6`}>{t('booking.selectService')}</h2>
      {services.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t('booking.noServices')}</p>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <button 
              key={svc.id} 
              onClick={() => onSelect(svc)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border ${isMinimal ? `border-gray-200 hover:${tColor.border}` : `border-white/5 hover:${tColor.borderSubtle} ${tColor.bgSubtleHover}`} transition-all text-left group`}
            >
              <div>
                <p className={`font-semibold ${textClass}`}>{svc.name}</p>
                <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                  <Clock size={12} /> {svc.duration_minutes} {t('booking.minutes')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`${tColor.text} font-bold`}>${svc.price}</span>
                <ChevronRight size={20} className={`text-gray-400 group-hover:${tColor.text} transition-colors`} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
