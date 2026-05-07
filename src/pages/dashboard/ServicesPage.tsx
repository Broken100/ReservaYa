import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Loader2, XCircle, LayoutList, Camera, Image as ImageIcon, Scissors, Sparkles, Heart, Eye, Paintbrush, Dumbbell, Stethoscope, Utensils, Car, GraduationCap, Music, Dog, Flower2, Coffee } from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useBusiness } from '../../hooks/useBusiness';

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  cabello: Scissors,
  hair: Scissors,
  uñas: Sparkles,
  nails: Sparkles,
  spa: Flower2,
  maquillaje: Paintbrush,
  makeup: Paintbrush,
  cejas: Eye,
  eyebrows: Eye,
  pestañas: Eye,
  lashes: Eye,
  barbería: Scissors,
  barber: Scissors,
  fitness: Dumbbell,
  gimnasio: Dumbbell,
  gym: Dumbbell,
  médico: Stethoscope,
  medical: Stethoscope,
  salud: Heart,
  restaurante: Utensils,
  restaurant: Utensils,
  auto: Car,
  automotive: Car,
  educación: GraduationCap,
  education: GraduationCap,
  música: Music,
  music: Music,
  mascota: Dog,
  pet: Dog,
  café: Coffee,
  coffee: Coffee,
  beauty: Sparkles,
  belleza: Sparkles,
};

function getServiceIcon(category: string | null) {
  if (!category) return LayoutList;
  const key = category.toLowerCase().trim();
  return categoryIcons[key] || LayoutList;
}
import { uploadPublicAsset } from '../../lib/storage';

export default function ServicesPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const { services, loading, addService, updateService, deleteService, toggleActive } = useServices(business?.id ?? null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', duration_minutes: 30, price: 0, currency: 'USD', is_active: true, image_url: '', category: '', duration_display: '', whats_included: '', recommendations: '', requires_pro: false });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const resetForm = () => {
    setForm({ name: '', description: '', duration_minutes: 30, price: 0, currency: 'USD', is_active: true, image_url: '', category: '', duration_display: '', whats_included: '', recommendations: '', requires_pro: false });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await updateService(editingId, form);
    } else {
      await addService(form);
    }
    resetForm();
  };

  const handleEdit = (svc: typeof services[0]) => {
    setForm({ name: svc.name, description: svc.description || '', duration_minutes: svc.duration_minutes, price: svc.price, currency: svc.currency, is_active: svc.is_active, image_url: svc.image_url || '', category: svc.category || '', duration_display: svc.duration_display || '', whats_included: svc.whats_included || '', recommendations: svc.recommendations || '', requires_pro: svc.requires_pro ?? false });
    setEditingId(svc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('services.deleteConfirm'))) await deleteService(id);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadPublicAsset(file, 'services');
      if (url) setForm(prev => ({ ...prev, image_url: url }));
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-white">{t('dashboard.services')}</h1>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setServiceFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  serviceFilter === f
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-dark-card text-gray-400 border-white/5 hover:border-white/20'
                }`}
              >
                {f === 'all' ? t('services.filter.all') : f === 'active' ? t('services.filter.active') : t('services.filter.inactive')}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all active:scale-95"
        >
          <Plus size={16} />
          {t('dashboard.addService')}
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-white/5 rounded-3xl">
          <LayoutList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('services.empty')}</p>
          <button onClick={() => setShowForm(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">+ {t('services.createFirst')}</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services
            .filter(s => serviceFilter === 'all' ? true : serviceFilter === 'active' ? s.is_active : !s.is_active)
            .map((service) => (
            <div key={service.id} className={`bg-dark-card rounded-3xl overflow-hidden border transition-all flex flex-col ${service.is_active ? 'border-white/5 hover:border-blue-500/30' : 'border-white/5 opacity-60'}`}>
              <div className="aspect-video bg-dark-bg relative w-full border-b border-white/5 group">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    {(() => { const Icon = getServiceIcon(service.category); return <Icon size={40} className="text-white/10" />; })()}
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{service.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {service.category && (
                        <span className="inline-block text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                          {service.category}
                        </span>
                      )}
                      {service.requires_pro && (
                        <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 h-10">{service.description || t('services.noDescription')}</p>
                    {service.whats_included && (
                      <p className="text-gray-500 text-xs line-clamp-1 mt-1">{service.whats_included}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-dark-bg p-1 rounded-xl border border-white/5 shrink-0 ml-4">
                  <button onClick={() => toggleActive(service.id, !service.is_active)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title={service.is_active ? t('services.deactivate') : t('services.activate')}>
                    {service.is_active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => { if (confirm(t('services.deleteConfirm'))) deleteService(service.id); }} className="p-2 rounded-lg hover:bg-red-600/10 text-gray-500 hover:text-red-400 transition-colors" title={t('services.delete')}><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <span className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/5">
                  {service.duration_display || `${service.duration_minutes} min`}
                </span>
                 <span className="text-xs font-bold text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  ${Number(service.price).toFixed(2)}
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                {!service.is_active ? (
                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-lg border border-red-500/20 font-bold uppercase tracking-wider">{t('services.inactive')}</span>
                ) : (
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> {t('services.available')}</span>
                )}
                
                <button onClick={() => handleEdit(service)} className="text-sm font-bold text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                  {t('services.viewDetails')} <Edit3 size={14} />
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over for Create/Edit */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={resetForm} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-dark-card">
              <h2 className="text-xl font-bold text-white">{editingId ? t('services.editTitle') : t('services.createTitle')}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Image Upload */}
              <div className="flex flex-col items-center">
                <div className="w-full h-40 bg-dark-card border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                  {form.image_url ? (
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-gray-500" />
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Camera className="text-white" size={24} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('services.form.imageHint')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.name')}</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" placeholder={t('services.form.namePlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.description')}</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none" placeholder={t('services.form.descriptionPlaceholder')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.duration')}</label>
                    <input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.price')}</label>
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.category')}</label>
                  <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" placeholder={t('services.form.categoryPlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.durationDisplay')}</label>
                  <input type="text" value={form.duration_display} onChange={e => setForm(p => ({ ...p, duration_display: e.target.value }))} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" placeholder="Ej: 45-60 min" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.whatsIncluded')}</label>
                  <textarea value={form.whats_included} onChange={e => setForm(p => ({ ...p, whats_included: e.target.value }))} rows={3} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none" placeholder={t('services.form.whatsIncludedPlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('services.form.recommendations')}</label>
                  <textarea value={form.recommendations} onChange={e => setForm(p => ({ ...p, recommendations: e.target.value }))} rows={3} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none" placeholder={t('services.form.recommendationsPlaceholder')} />
                </div>

                <label className="flex items-center gap-3 bg-dark-card p-5 rounded-2xl border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
                  <div>
                    <p className="text-white font-medium text-sm">{t('services.form.active')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{t('services.form.activeHelp')}</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-purple-500/5 p-5 rounded-2xl border border-purple-500/20 cursor-pointer hover:border-purple-500/30 transition-colors">
                  <input type="checkbox" checked={form.requires_pro} onChange={e => setForm(f => ({...f, requires_pro: e.target.checked}))} className="w-5 h-5 accent-purple-600 rounded" />
                  <div>
                    <p className="text-white font-medium text-sm">{t('services.form.requiresPro')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{t('services.form.requiresProHelp')}</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-dark-card flex gap-3">
              <button onClick={handleSubmit} disabled={!form.name.trim()} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50">
                {editingId ? t('services.saveChanges') : t('services.create')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
