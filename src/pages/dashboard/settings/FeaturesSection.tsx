import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';

interface FeaturesSettings {
  enable_products?: boolean;
  theme_color?: string;
  theme?: string;
  show_socials?: boolean;
  show_services?: boolean;
  show_products?: boolean;
}

interface FeaturesSectionProps {
  settings: FeaturesSettings;
  setSettings: (updater: (prev: FeaturesSettings) => FeaturesSettings) => void;
  tColor: Record<string, string>;
}

export default function FeaturesSection({ settings, setSettings, tColor }: FeaturesSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-8 shadow-sm">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center shrink-0">
          <Store className="text-purple-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{t('settings.customizationTitle')}</h2>
          <p className="text-gray-500 text-sm">{t('settings.customizationDesc')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-dark-bg p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{t('settings.enableProducts')}</p>
            <p className="text-gray-500 text-xs mt-1">{t('settings.enableProductsDesc')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={!!settings.enable_products}
              onChange={e => setSettings(s => ({ ...s, enable_products: e.target.checked }))}
            />
            <div className={`w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${tColor.bg}`}></div>
          </label>
        </div>

        <div className="bg-dark-bg p-5 rounded-2xl border border-white/5">
          <div>
            <p className="text-white font-semibold mb-3">{t('settings.themeLabel')}</p>
          </div>
          <select
            value={settings.theme || 'default'}
            onChange={e => setSettings(s => ({ ...s, theme: e.target.value }))}
            className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="default">{t('settings.themes.default')}</option>
            <option value="ocean">{t('settings.themes.ocean')}</option>
            <option value="forest">{t('settings.themes.forest')}</option>
            <option value="sunset">{t('settings.themes.sunset')}</option>
          </select>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-4 border-t border-white/5 pt-6">{t('settings.visibilityTitle')}</h3>
      <div className="space-y-4 mb-8">
        <label className="flex items-center justify-between bg-dark-bg p-4 rounded-xl border border-white/5 cursor-pointer">
          <div>
            <p className="text-white font-medium">{t('settings.showSocials')}</p>
            <p className="text-gray-500 text-xs">{t('settings.showSocialsDesc')}</p>
          </div>
          <input type="checkbox" checked={settings.show_socials !== false} onChange={e => setSettings(s => ({...s, show_socials: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
        </label>
        <label className="flex items-center justify-between bg-dark-bg p-4 rounded-xl border border-white/5 cursor-pointer">
          <div>
            <p className="text-white font-medium">{t('settings.showServices')}</p>
            <p className="text-gray-500 text-xs">{t('settings.showServicesDesc')}</p>
          </div>
          <input type="checkbox" checked={settings.show_services !== false} onChange={e => setSettings(s => ({...s, show_services: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
        </label>
        <label className="flex items-center justify-between bg-dark-bg p-4 rounded-xl border border-white/5 cursor-pointer">
          <div>
            <p className="text-white font-medium">{t('settings.showProducts')}</p>
            <p className="text-gray-500 text-xs">{t('settings.showProductsDesc')}</p>
          </div>
          <input type="checkbox" checked={settings.show_products !== false} onChange={e => setSettings(s => ({...s, show_products: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
        </label>
      </div>
    </section>
  );
}
