import { useTranslation } from 'react-i18next';
import { Loader2, Camera, Store } from 'lucide-react';

interface GeneralSectionProps {
  form: {
    name: string;
    category: string;
    phone: string;
    address: string;
    city: string;
    logo_url: string;
    description: string;
    google_maps_url: string;
    whatsapp_number: string;
  };
  setForm: (updater: (prev: GeneralSectionProps['form']) => GeneralSectionProps['form']) => void;
  uploadingLogo: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tColor: Record<string, string>;
}

export default function GeneralSection({ form, setForm, uploadingLogo, onLogoUpload, tColor }: GeneralSectionProps) {
  const { t } = useTranslation();
  const categories = t('settings.categories', { returnObjects: true }) as unknown as string[];

  return (
    <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-8 shadow-sm">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Store size={40} className="text-blue-400" />
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <label className={`absolute -bottom-2 -right-2 p-2 ${tColor.bg} rounded-full text-white cursor-pointer shadow-lg ${tColor.bgHover} transition-colors border border-dark-bg`}>
            <Camera size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} disabled={uploadingLogo} />
          </label>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{t('settings.businessInfo')}</h2>
          <p className="text-gray-500 text-sm mb-2">{t('settings.businessInfoDesc')}</p>
          <p className="text-gray-600 text-xs bg-white/5 p-2 rounded-lg border border-white/5 inline-block">
            {t('settings.logoRecommendation')}
          </p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('settings.form.name')}</label>
          <input 
            type="text" 
            value={form.name} 
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('settings.form.category')}</label>
          <div className="space-y-3">
            <select 
              value={categories.includes(form.category) ? form.category : t('settings.otherCategory')}
              onChange={e => {
                const val = e.target.value;
                setForm(p => ({ ...p, category: val }));
              }}
              className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
            >
              {categories.map(cat => (
                <option key={cat}>{cat}</option>
              ))}
              <option value={t('settings.otherCategory')}>{t('settings.otherCategory')}</option>
            </select>

            {(!categories.includes(form.category) || form.category === t('settings.otherCategory')) && (
              <input 
                type="text" 
                value={form.category === t('settings.otherCategory') ? '' : form.category}
                placeholder={t('settings.form.customCategoryPlaceholder')}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all animate-in slide-in-from-top-2" 
              />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('settings.form.phone')}</label>
          <input 
            type="tel" 
            value={form.phone} 
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('settings.form.city')}</label>
          <input 
            type="text" 
            value={form.city} 
            onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
            className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('settings.form.description')}</label>
          <textarea 
            value={form.description} 
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]" 
            placeholder={t('settings.form.descriptionPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('settings.form.googleMapsUrl')}</label>
          <input 
            type="url" 
            value={form.google_maps_url} 
            onChange={e => setForm(p => ({ ...p, google_maps_url: e.target.value }))}
            className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
            placeholder={t('settings.form.googleMapsPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('settings.form.whatsappDirect')}</label>
          <input 
            type="text" 
            value={form.whatsapp_number} 
            onChange={e => setForm(p => ({ ...p, whatsapp_number: e.target.value }))}
            className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
            placeholder={t('settings.form.whatsappPlaceholder')}
          />
        </div>
      </div>
    </section>
  );
}
