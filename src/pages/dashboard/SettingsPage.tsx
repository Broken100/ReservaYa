import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBusiness } from '../../hooks/useBusiness';
import { useBusinessHours } from '../../hooks/useBusinessHours';
import { uploadPublicAsset } from '../../lib/storage';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import GeneralSection from './settings/GeneralSection';
import PaymentSection from './settings/PaymentSection';
import FeaturesSection from './settings/FeaturesSection';
import SocialSection from './settings/SocialSection';
import HoursSection from './settings/HoursSection';
import DangerZone from './settings/DangerZone';

interface BusinessSettings {
  enable_products?: boolean;
  theme_color?: string;
  theme?: string;
  show_socials?: boolean;
  show_services?: boolean;
  show_products?: boolean;
  cancellation_hours?: number;
  social_links?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
}

interface FormState {
  name: string;
  category: string;
  phone: string;
  address: string;
  city: string;
  logo_url: string;
  description: string;
  google_maps_url: string;
  whatsapp_number: string;
  qr_code_url: string;
  whatsapp_direct: boolean;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { business, loading: businessLoading, updateBusiness, deleteBusiness } = useBusiness();
  const { hours, loading: hoursLoading, updateHours } = useBusinessHours(business?.id ?? null);
  const { tColor } = useTheme();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<FormState>({ 
    name: '', category: '', phone: '', address: '', city: '', logo_url: '',
    description: '', google_maps_url: '', whatsapp_number: '', qr_code_url: '', whatsapp_direct: false
  });
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [localHours, setLocalHours] = useState<{ day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        category: business.category || '',
        phone: business.phone || '',
        address: business.address || '',
        city: business.city || '',
        logo_url: business.logo_url || '',
        description: business.description || '',
        google_maps_url: business.google_maps_url || '',
        whatsapp_number: business.whatsapp_number || '',
        qr_code_url: business.qr_code_url || '',
        whatsapp_direct: business.whatsapp_direct || false,
      });
      setSettings((business.settings as BusinessSettings) || { 
        enable_products: false, 
        theme_color: '#3b82f6',
        theme: 'default',
        show_socials: true,
        show_services: true,
        show_products: true,
        cancellation_hours: business.settings?.cancellation_hours ?? 2,
        social_links: { whatsapp: '', instagram: '', facebook: '', website: '' }
      });
    }
  }, [business]);

  useEffect(() => {
    if (hours.length > 0) {
      setLocalHours(hours);
    } else {
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        open_time: '09:00',
        close_time: '18:00',
        is_closed: i === 0
      }));
      setLocalHours(defaultHours);
    }
  }, [hours]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await uploadPublicAsset(file, 'logos');
      if (url) {
        setForm(p => ({ ...p, logo_url: url }));
      } else {
        toast.error(t('settings.errorUploadLogo'));
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      const url = await uploadPublicAsset(file, 'qrcodes');
      if (url) setForm(p => ({ ...p, qr_code_url: url }));
      else toast.error(t('settings.errorUploadQr'));
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBusiness({ ...form, settings: settings as Record<string, unknown> });
      await updateHours(localHours.map(({ day_of_week, open_time, close_time, is_closed }) => ({
        day_of_week,
        open_time: open_time.length === 5 ? `${open_time}:00` : open_time,
        close_time: close_time.length === 5 ? `${close_time}:00` : close_time,
        is_closed
      })));
      toast.success(t('settings.savedSuccess'));
    } catch (err) {
      toast.error(t('settings.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayIndex: number, field: string, value: string | boolean) => {
    setLocalHours(prev => prev.map(h => 
      h.day_of_week === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const handleDeleteBusiness = async () => {
    if (!business || !deleteBusiness) return;
    const confirmed = window.confirm(t('settings.deleteConfirm'));
    if (confirmed) {
      const secondConfirm = window.confirm(t('settings.deleteConfirmFinal'));
      if (secondConfirm) {
        try {
          await deleteBusiness(business.id);
          navigate('/');
        } catch (e) {
          toast.error(t('settings.errorDelete'));
        }
      }
    }
  };

  if (businessLoading || hoursLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className={`animate-spin ${tColor.text}`} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-20">
      <h1 className="text-2xl font-bold text-white mb-8">{t('dashboard.settings')}</h1>

      <GeneralSection
        form={form}
        setForm={setForm}
        uploadingLogo={uploadingLogo}
        onLogoUpload={handleLogoUpload}
        tColor={tColor}
      />

      <PaymentSection
        whatsapp_direct={form.whatsapp_direct}
        qr_code_url={form.qr_code_url}
        setForm={(updater) => setForm(p => ({ ...p, ...updater(p) }))}
        uploadingQr={uploadingQr}
        onQrUpload={handleQrUpload}
        tColor={tColor}
      />

      <FeaturesSection
        settings={settings}
        setSettings={setSettings}
        tColor={tColor}
      />

      <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-8 shadow-sm">
        <SocialSection
          socialLinks={settings.social_links || {}}
          setSettings={(updater) => setSettings(s => ({ ...s, ...updater(s) }))}
        />
      </section>

      <HoursSection
        localHours={localHours}
        onUpdateDay={updateDay}
        cancellationHours={settings.cancellation_hours ?? 2}
        onCancellationHoursChange={(hours) => setSettings(s => ({ ...s, cancellation_hours: hours }))}
      />

      <DangerZone onDelete={handleDeleteBusiness} />

      <button 
        onClick={handleSave}
        disabled={saving}
        className={`fixed bottom-10 right-10 flex items-center gap-3 ${tColor.bg} text-white px-10 py-5 rounded-[2rem] font-bold ${tColor.bgHover} transition-all active:scale-95 disabled:opacity-50 shadow-2xl ${tColor.shadowLg} z-30`}
      >
        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        Guardar Configuración
      </button>
    </div>
  );
}
