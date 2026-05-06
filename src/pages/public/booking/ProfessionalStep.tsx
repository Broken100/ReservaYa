import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Professional } from '../../../types/database';

interface ThemeColor {
  text: string;
  border: string;
  borderSubtle: string;
  bgSubtle: string;
  bgSubtleHover: string;
}

interface ProfessionalStepProps {
  professionals: Professional[];
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  isMinimal: boolean;
  tColor: ThemeColor;
  onSelect: (professional: Professional | null) => void;
  onBack: () => void;
}

export default function ProfessionalStep({ professionals, textClass, textMutedClass, cardClass, isMinimal, tColor, onSelect, onBack }: ProfessionalStepProps) {
  const { t } = useTranslation();
  return (
    <div className={`${cardClass} rounded-3xl p-8`}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className={`${textMutedClass} hover:${textClass} transition-colors`}>
          {t('booking.back')}
        </button>
        <h2 className={`text-xl font-bold ${textClass}`}>{t('booking.selectProfessional')}</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={() => onSelect(null)}
          className={`flex items-center gap-4 p-4 rounded-2xl border ${isMinimal ? `border-gray-200 hover:${tColor.border}` : `border-white/5 hover:${tColor.borderSubtle} ${tColor.bgSubtleHover}`} transition-all text-left group`}
        >
          <div className={`w-12 h-12 rounded-full ${isMinimal ? 'bg-gray-100' : 'bg-white/5'} flex items-center justify-center text-gray-400 group-hover:${tColor.text} transition-colors`}>
            <User size={20} />
          </div>
          <div>
            <p className={`font-medium ${textClass}`}>{t('booking.anyProfessional')}</p>
            <p className="text-gray-500 text-xs">{t('booking.maxAvailability')}</p>
          </div>
        </button>
        
        {professionals.map((prof) => (
          <button 
            key={prof.id}
            onClick={() => onSelect(prof)}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${isMinimal ? `border-gray-200 hover:${tColor.border}` : `border-white/5 hover:${tColor.borderSubtle} ${tColor.bgSubtleHover}`} transition-all text-left`}
          >
            {prof.avatar_url ? (
              <img src={prof.avatar_url} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className={`w-12 h-12 rounded-full ${tColor.bgSubtle} flex items-center justify-center ${tColor.text} font-bold`}>
                {prof.name.substring(0, 1)}
              </div>
            )}
            <div>
              <p className={`font-medium ${textClass}`}>{prof.name}</p>
              {prof.specialty && <p className="text-gray-500 text-xs">{prof.specialty}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
