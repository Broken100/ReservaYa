import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicAsset } from '../../lib/storage';

export default function ClientProfilePage() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadPublicAsset(file, 'avatars');
      if (url) {
        setForm(p => ({ ...p, avatar_url: url }));
      } else {
        alert('Error al subir la imagen');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone) return alert('Todos los campos son obligatorios');
    
    setSaving(true);
    setSuccess(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: form.full_name,
          phone: form.phone,
          avatar_url: form.avatar_url
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Update local storage or trigger context reload if needed
      window.location.reload(); 
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error al guardar datos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t('client.profileTitle') || 'Mi Perfil'}</h1>
        <p className="text-gray-400">{t('client.profileSubtitle') || 'Actualiza tu información de contacto para tus reservas.'}</p>
      </div>

      <div className="bg-dark-card rounded-3xl p-8 sm:p-10 border border-white/5 shadow-xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-blue-400" />
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer shadow-lg hover:bg-blue-500 transition-colors border border-dark-bg">
              <Camera size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.email}</h2>
            <p className="text-gray-500 text-sm mt-1">Cliente de ReservaYa</p>
            <p className="text-gray-600 text-xs mt-2 bg-white/5 p-2 rounded-lg border border-white/5">
              💡 <strong>Recomendado:</strong> Imagen cuadrada, min. 256x256px, PNG/JPG, máx 2MB.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Nombre Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full bg-dark-bg border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                placeholder="Tu nombre completo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Teléfono / WhatsApp</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full bg-dark-bg border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                placeholder="Ej: 0990000000"
              />
            </div>
            <p className="text-xs text-gray-500 ml-1">Los negocios usarán este número para contactarte sobre tus reservas.</p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-end gap-4">
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 size={16} />
              <span>Guardado correctamente</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !form.full_name || !form.phone}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('client.saveChanges') || 'Guardar Cambios')}
          </button>
        </div>
      </div>
    </div>
  );
}
