import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import type { Service } from '../../../types/database';

interface ThemeColor {
  bg: string;
  bgHover: string;
  text: string;
  textLight: string;
  border: string;
  borderSubtle: string;
  bgSubtle: string;
  bgSubtleHover: string;
  shadow: string;
  shadowLg: string;
}

interface ServiceStepProps {
  services: Service[];
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  isMinimal: boolean;
  tColor: ThemeColor;
  isBusinessPro: boolean;
  onSelect: (service: Service) => void;
}

export default function ServiceStep({ services, textClass, textMutedClass, cardClass, isMinimal, tColor, isBusinessPro, onSelect }: ServiceStepProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className={`${cardClass} rounded-3xl p-8`}>
      <h2 className={`text-xl font-bold ${textClass} mb-6`}>{t('booking.selectService')}</h2>
      {services.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t('booking.noServices')}</p>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => {
            const isExpanded = expandedId === svc.id;
            const locked = svc.requires_pro && !isBusinessPro;
            const includedItems = svc.whats_included ? svc.whats_included.split(',').map(s => s.trim()).filter(Boolean) : [];
            const recommendationItems = svc.recommendations ? svc.recommendations.split(',').map(s => s.trim()).filter(Boolean) : [];

            return (
              <div
                key={svc.id}
                className={`rounded-2xl border transition-all overflow-hidden ${locked ? 'opacity-50' : ''} ${isMinimal ? 'border-gray-200' : 'border-white/5'} ${isExpanded ? (isMinimal ? 'bg-gray-50' : 'bg-white/5') : ''}`}
              >
                <button
                  onClick={() => !locked && setExpandedId(isExpanded ? null : svc.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold ${textClass}`}>{svc.name}</p>
                      {svc.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isMinimal ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-gray-400'}`}>
                          {svc.category}
                        </span>
                      )}
                      {locked && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                          <Lock size={10} /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                      <Clock size={12} /> {svc.duration_display || `${svc.duration_minutes}${t('booking.minutes')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className={`${tColor.text} font-bold`}>${svc.price}</span>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5">
                    <div className={`border-t ${isMinimal ? 'border-gray-100' : 'border-white/5'} mb-3`} />

                    {svc.description && (
                      <p className={`${textMutedClass} text-sm mb-3`}>{svc.description}</p>
                    )}

                    {includedItems.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-xs font-medium ${textClass} mb-1`}>{t('booking.includes')}</p>
                        <ul className="space-y-1">
                          {includedItems.map((item, i) => (
                            <li key={i} className={`${textMutedClass} text-sm flex items-center gap-2`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${tColor.bg}`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {recommendationItems.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-xs font-medium ${textClass} mb-1`}>{t('booking.recommendationsTitle')}</p>
                        <ul className="space-y-1">
                          {recommendationItems.map((rec, i) => (
                            <li key={i} className={`${textMutedClass} text-sm flex items-center gap-2`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${tColor.bg}`} />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => !locked && onSelect(svc)}
                      disabled={locked}
                      className={`w-full py-3 rounded-xl font-bold transition-colors mt-2 ${
                        locked
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : `${tColor.bg} ${tColor.bgHover} text-white`
                      }`}
                    >
                      {locked ? t('booking.proOnly') : t('booking.select')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}