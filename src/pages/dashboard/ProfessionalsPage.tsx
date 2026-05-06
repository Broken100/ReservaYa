import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Loader2, XCircle, UserCheck, Camera, User } from 'lucide-react';
import { useProfessionals } from '../../hooks/useProfessionals';
import { useBusiness } from '../../hooks/useBusiness';
import { uploadPublicAsset } from '../../lib/storage';

export default function ProfessionalsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const { professionals, loading, addProfessional, updateProfessional, deleteProfessional, toggleActive } = useProfessionals(business?.id ?? null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', specialty: '', is_active: true, avatar_url: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  const resetForm = () => { setForm({ name: '', specialty: '', is_active: true, avatar_url: '' }); setShowForm(false); setEditingId(null); };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (editingId) await updateProfessional(editingId, form);
    else await addProfessional(form);
    resetForm();
  };

  const handleEdit = (pro: typeof professionals[0]) => {
    setForm({ name: pro.name, specialty: pro.specialty || '', is_active: pro.is_active, avatar_url: pro.avatar_url || '' });
    setEditingId(pro.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadPublicAsset(file, 'avatars');
      if (url) setForm(prev => ({ ...prev, avatar_url: url }));
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">{t('dashboard.professionals')}</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all active:scale-95">
          <Plus size={16} />
          {t('dashboard.addProfessional')}
        </button>
      </div>

      {professionals.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-white/5 rounded-3xl">
          <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('professionals.empty')}</p>
          <button onClick={() => setShowForm(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">+ {t('professionals.createFirst')}</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {professionals.map((pro) => (
            <div key={pro.id} className={`bg-dark-card rounded-3xl p-6 border transition-all ${pro.is_active ? 'border-white/5 hover:border-blue-500/30' : 'border-white/5 opacity-60'} flex flex-col`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-dark-bg flex items-center justify-center text-blue-400 text-2xl font-bold shrink-0 overflow-hidden border border-white/5 relative group">
                  {pro.avatar_url ? (
                    <img src={pro.avatar_url} alt={pro.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      {pro.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-dark-bg p-1 rounded-xl border border-white/5">
                  <button onClick={() => toggleActive(pro.id, !pro.is_active)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors" title={pro.is_active ? t('professionals.deactivate') : t('professionals.activate')}>
                    {pro.is_active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => { if (confirm(t('professionals.deleteConfirm'))) deleteProfessional(pro.id); }} className="p-2 rounded-lg hover:bg-red-600/10 text-gray-500 hover:text-red-400 transition-colors" title={t('professionals.delete')}><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{pro.name}</h3>
                <p className="text-gray-400 text-sm font-medium">{pro.specialty || t('professionals.noSpecialty')}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                {!pro.is_active ? (
                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-lg border border-red-500/20 font-bold uppercase tracking-wider">{t('professionals.inactive')}</span>
                ) : (
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> {t('professionals.available')}</span>
                )}
                
                <button onClick={() => handleEdit(pro)} className="text-sm font-bold text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                  {t('professionals.viewDetails')} <Edit3 size={14} />
                </button>
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
              <h2 className="text-xl font-bold text-white">{editingId ? t('professionals.editTitle') : t('professionals.createTitle')}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Image Upload */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-dark-card border-2 border-dashed border-white/20 rounded-full flex items-center justify-center overflow-hidden relative group">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-gray-500" />
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Camera className="text-white" size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('professionals.form.imageHint')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('professionals.form.name')}</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" placeholder={t('professionals.form.namePlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">{t('professionals.form.specialty')}</label>
                  <input type="text" value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} className="w-full bg-dark-card border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" placeholder={t('professionals.form.specialtyPlaceholder')} />
                </div>
                
                <label className="flex items-center gap-3 bg-dark-card p-5 rounded-2xl border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
                  <div>
                    <p className="text-white font-medium text-sm">{t('professionals.form.active')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{t('professionals.form.activeHelp')}</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-dark-card flex gap-3">
              <button onClick={handleSubmit} disabled={!form.name.trim()} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50">
                {editingId ? t('professionals.saveChanges') : t('professionals.create')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
