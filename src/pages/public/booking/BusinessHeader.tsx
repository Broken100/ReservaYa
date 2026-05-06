import { MapPin, Instagram, Facebook, Globe, MessageCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import type { Business } from '../../../types/database';

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

interface BusinessHeaderProps {
  business: Pick<Business, 'logo_url' | 'name' | 'city' | 'description'>;
  settings: Business['settings'];
  textClass: string;
  textMutedClass: string;
  tColor: ThemeColor;
}

export default function BusinessHeader({ business, settings, textClass, textMutedClass, tColor }: BusinessHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role } = useAuth();

  return (
    <div className="text-center mb-10">
      <button
        onClick={() => navigate(role === 'client' ? '/cliente/explorar' : '/')}
        className={`flex items-center gap-1 ${textMutedClass} hover:${textClass} transition-colors mb-6`}
      >
        <ChevronLeft size={18} />
        {t('booking.backToHome')}
      </button>
      {business.logo_url ? (
        <img src={business.logo_url} alt={business.name} className={`w-24 h-24 rounded-3xl mx-auto mb-5 object-cover shadow-2xl ${tColor.shadow}`} />
      ) : (
        <div className={`w-24 h-24 ${tColor.bg} rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl font-bold text-white shadow-2xl ${tColor.shadow}`}>
          {business.name.substring(0, 2).toUpperCase()}
        </div>
      )}
      <h1 className={`text-4xl font-bold ${textClass} mb-3`}>{business.name}</h1>
      <p className={`${textMutedClass} flex items-center justify-center gap-2 mb-4`}>
        <MapPin size={16} /> {business.city || 'Ecuador'}
      </p>
      {business.description && (
        <p className={`${textMutedClass} max-w-lg mx-auto leading-relaxed`}>{business.description}</p>
      )}

      {/* SOCIAL LINKS (Linktree Style) */}
      {settings?.show_socials !== false && settings?.social_links && (
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {settings.social_links.whatsapp && (
            <a href={`https://wa.me/${settings.social_links.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-full font-medium transition-all">
              <MessageCircle size={18} /> WhatsApp
            </a>
          )}
          {settings.social_links.instagram && (
            <a href={settings.social_links.instagram.includes('http') ? settings.social_links.instagram : `https://instagram.com/${settings.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white rounded-full font-medium transition-all">
              <Instagram size={18} /> Instagram
            </a>
          )}
          {settings.social_links.facebook && (
            <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-full font-medium transition-all">
              <Facebook size={18} /> Facebook
            </a>
          )}
          {settings.social_links.website && (
            <a href={settings.social_links.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white rounded-full font-medium transition-all">
              <Globe size={18} /> Web
            </a>
          )}
        </div>
      )}
    </div>
  );
}
