import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, ChevronDown, ChevronUp, Instagram, Facebook, Twitter } from 'lucide-react';
import type { Professional } from '../../../types/database';
import FavoriteButton from '../../../components/ui/FavoriteButton';

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

interface ProfessionalStepProps {
  professionals: Professional[];
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  isMinimal: boolean;
  tColor: ThemeColor;
  onSelect: (professional: Professional | null) => void;
  onBack: () => void;
  isFavorited: (params: { professionalId?: string }) => boolean;
  toggleFavorite: (params: { professionalId?: string }) => void;
}

export default function ProfessionalStep({ professionals, textClass, textMutedClass, cardClass, isMinimal, tColor, onSelect, onBack, isFavorited, toggleFavorite }: ProfessionalStepProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedProfessionals = [...professionals].sort((a, b) => {
    const aFav = isFavorited({ professionalId: a.id }) ? 0 : 1;
    const bFav = isFavorited({ professionalId: b.id }) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <div className={`${cardClass} rounded-3xl p-8`}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className={`${textMutedClass} hover:${textClass} transition-colors`}>
          {t('booking.back')}
        </button>
        <h2 className={`text-xl font-bold ${textClass}`}>{t('booking.selectProfessional')}</h2>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${isMinimal ? 'border-gray-200 hover:border-gray-300' : 'border-white/5 hover:border-white/10 hover:bg-white/5'} transition-all text-left group`}
        >
          <div className={`w-12 h-12 rounded-full ${isMinimal ? 'bg-gray-100' : 'bg-white/5'} flex items-center justify-center text-gray-400 group-hover:${tColor.text} transition-colors`}>
            <User size={20} />
          </div>
          <div>
            <p className={`font-medium ${textClass}`}>{t('booking.anyProfessional')}</p>
            <p className="text-gray-500 text-xs">{t('booking.maxAvailability')}</p>
          </div>
        </button>

        {sortedProfessionals.map((prof) => {
          const isExpanded = expandedId === prof.id;
          const socialLinks = prof.social_links;
          const hasSocials = socialLinks && (socialLinks.instagram || socialLinks.facebook || socialLinks.twitter);

          return (
            <div
              key={prof.id}
              className={`relative rounded-2xl border transition-all overflow-hidden ${isMinimal ? 'border-gray-200' : 'border-white/5'} ${isExpanded ? (isMinimal ? 'bg-gray-50' : 'bg-white/5') : ''} ${isFavorited({ professionalId: prof.id }) ? 'ring-1 ring-yellow-500/30' : ''}`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : prof.id)}
                  className="flex-1 flex items-center gap-4 p-4 text-left"
                >
                  {prof.avatar_url ? (
                    <img src={prof.avatar_url} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${tColor.bgSubtle} flex items-center justify-center ${tColor.text} font-bold`}>
                      {prof.name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={`font-medium ${textClass}`}>{prof.name}</p>
                    {(prof.specialty || prof.position) && (
                      <p className="text-gray-500 text-xs">{prof.specialty || prof.position}</p>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2 px-4">
                  <FavoriteButton
                    isFavorited={isFavorited({ professionalId: prof.id })}
                    onToggle={() => toggleFavorite({ professionalId: prof.id })}
                    size={16}
                    className="opacity-60 hover:opacity-100"
                  />
                  {isExpanded ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5">
                  <div className={`border-t ${isMinimal ? 'border-gray-100' : 'border-white/5'} mb-3`} />

                  {prof.full_name && prof.full_name !== prof.name && (
                    <p className={`${textClass} font-semibold text-sm mb-1`}>{prof.full_name}</p>
                  )}

                  {prof.specialty && (
                    <p className={`${textMutedClass} text-sm mb-1`}>{prof.specialty}</p>
                  )}

                  {prof.position && prof.position !== prof.specialty && (
                    <p className={`${textMutedClass} text-sm mb-1`}>{prof.position}</p>
                  )}

                  {prof.years_experience !== null && prof.years_experience !== undefined && (
                    <p className={`${textMutedClass} text-sm mb-1`}>
                      {t('booking.experience')}: {prof.years_experience} {t('booking.years')}
                    </p>
                  )}

                  {prof.slogan && (
                    <p className={`${tColor.textLight} text-sm italic mb-2`}>"{prof.slogan}"</p>
                  )}

                  {prof.bio && (
                    <p className={`${textMutedClass} text-sm mb-2`}>{prof.bio}</p>
                  )}

                  {prof.availability_notes && (
                    <div className="mb-2">
                      <p className={`text-xs font-medium ${textClass} mb-0.5`}>{t('booking.availability')}</p>
                      <p className={`${textMutedClass} text-sm`}>{prof.availability_notes}</p>
                    </div>
                  )}

                  {hasSocials && (
                    <div className="flex gap-3 mb-3">
                      {socialLinks?.instagram && (
                        <a href={socialLinks.instagram.includes('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className={`${textMutedClass} hover:${tColor.text} transition-colors`}>
                          <Instagram size={16} />
                        </a>
                      )}
                      {socialLinks?.facebook && (
                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={`${textMutedClass} hover:${tColor.text} transition-colors`}>
                          <Facebook size={16} />
                        </a>
                      )}
                      {socialLinks?.twitter && (
                        <a href={socialLinks.twitter.includes('http') ? socialLinks.twitter : `https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className={`${textMutedClass} hover:${tColor.text} transition-colors`}>
                          <Twitter size={16} />
                        </a>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => onSelect(prof)}
                    className={`w-full py-3 ${tColor.bg} ${tColor.bgHover} text-white rounded-xl font-bold transition-colors mt-2`}
                  >
                    {t('booking.chooseProfessional')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}