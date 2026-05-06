import { useTranslation } from 'react-i18next';

interface SocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

interface SocialSectionProps {
  socialLinks: SocialLinks;
  setSettings: (updater: (prev: { social_links: SocialLinks }) => { social_links: SocialLinks }) => void;
}

export default function SocialSection({ socialLinks, setSettings }: SocialSectionProps) {
  const { t } = useTranslation();
  const links = socialLinks || {};

  return (
    <>
      <h3 className="text-lg font-bold text-white mb-4 border-t border-white/5 pt-6">{t('settings.socialLinksTitle')}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('settings.socialLinks.whatsapp')}</label>
          <input 
            type="text" 
            value={links.whatsapp || ''} 
            onChange={e => setSettings(s => ({ ...s, social_links: { ...links, whatsapp: e.target.value } }))}
            className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('settings.socialLinks.instagram')}</label>
          <input 
            type="text" 
            value={links.instagram || ''} 
            onChange={e => setSettings(s => ({ ...s, social_links: { ...links, instagram: e.target.value } }))}
            className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('settings.socialLinks.facebook')}</label>
          <input 
            type="text" 
            value={links.facebook || ''} 
            onChange={e => setSettings(s => ({ ...s, social_links: { ...links, facebook: e.target.value } }))}
            className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('settings.socialLinks.website')}</label>
          <input 
            type="text" 
            value={links.website || ''} 
            onChange={e => setSettings(s => ({ ...s, social_links: { ...links, website: e.target.value } }))}
            className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
          />
        </div>
      </div>
    </>
  );
}
