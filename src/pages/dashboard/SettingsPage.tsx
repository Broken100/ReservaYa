import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, Clock, Camera, Store } from 'lucide-react';
import { useBusiness } from '../../hooks/useBusiness';
import { useBusinessHours } from '../../hooks/useBusinessHours';
import { uploadPublicAsset } from '../../lib/storage';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { business, loading: businessLoading, updateBusiness, deleteBusiness } = useBusiness();
  const { hours, loading: hoursLoading, updateHours } = useBusinessHours(business?.id ?? null);
  const { tColor } = useTheme();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: '', category: '', phone: '', address: '', city: '', logo_url: '',
    description: '', google_maps_url: '', whatsapp_number: '', qr_code_url: '', whatsapp_direct: false
  });
  const [settings, setSettings] = useState<{
    enable_products?: boolean;
    theme_color?: string;
    theme?: string;
    show_socials?: boolean;
    show_services?: boolean;
    show_products?: boolean;
    social_links?: {
      whatsapp?: string;
      instagram?: string;
      facebook?: string;
      website?: string;
    }
  }>({});
  const [localHours, setLocalHours] = useState<any[]>([]);
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
      setSettings((business.settings as any) || { 
        enable_products: false, 
        theme_color: '#3b82f6',
        theme: 'default',
        show_socials: true,
        show_services: true,
        show_products: true,
        social_links: { whatsapp: '', instagram: '', facebook: '', website: '' }
      });
    }
  }, [business]);

  useEffect(() => {
    if (hours.length > 0) {
      setLocalHours(hours);
    } else {
      // Default hours if none exist
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        open_time: '09:00',
        close_time: '18:00',
        is_closed: i === 0 // Sunday closed by default
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
        alert('Error al subir el logo');
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
      else alert('Error al subir el QR');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBusiness({ ...form, settings });
      await updateHours(localHours.map(({ day_of_week, open_time, close_time, is_closed }) => ({
        day_of_week,
        open_time: open_time.length === 5 ? `${open_time}:00` : open_time,
        close_time: close_time.length === 5 ? `${close_time}:00` : close_time,
        is_closed
      })));
      alert('Configuración actualizada correctamente');
    } catch (err) {
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayIndex: number, field: string, value: any) => {
    setLocalHours(prev => prev.map(h => 
      h.day_of_week === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const handleDeleteBusiness = async () => {
    if (!business || !deleteBusiness) return;
    const confirmed = window.confirm('¿Estás SEGURO de que deseas eliminar tu negocio? Esta acción es irreversible y se perderán todos tus datos, servicios, productos y reservas.');
    if (confirmed) {
      const secondConfirm = window.confirm('Confirmación final: ¿Eliminar negocio permanentemente?');
      if (secondConfirm) {
        try {
          await deleteBusiness(business.id);
          navigate('/');
        } catch (e) {
          alert('Error al eliminar el negocio');
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

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="max-w-3xl pb-20">
      <h1 className="text-2xl font-bold text-white mb-8">{t('dashboard.settings')}</h1>

      {/* Info Negocio */}
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
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Información del Negocio</h2>
            <p className="text-gray-500 text-sm mb-2">Personaliza el logo y detalles de tu empresa.</p>
            <p className="text-gray-600 text-xs bg-white/5 p-2 rounded-lg border border-white/5 inline-block">
              💡 <strong>Recomendado para Logo:</strong> Imagen PNG centrada (sin fondo), min. 512x512px.
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Nombre</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Categoría</label>
            <div className="space-y-3">
              <select 
                value={['Peluquería', 'Consultorio', 'Restaurante', 'Gimnasio'].includes(form.category) ? form.category : 'Otro'}
                onChange={e => {
                  const val = e.target.value;
                  setForm(p => ({ ...p, category: val }));
                }}
                className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              >
                <option>Peluquería</option>
                <option>Consultorio</option>
                <option>Restaurante</option>
                <option>Gimnasio</option>
                <option value="Otro">Otro...</option>
              </select>

              {(!['Peluquería', 'Consultorio', 'Restaurante', 'Gimnasio'].includes(form.category) || form.category === 'Otro') && (
                <input 
                  type="text" 
                  value={form.category === 'Otro' ? '' : form.category}
                  placeholder="Especifica tu rubro..."
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all animate-in slide-in-from-top-2" 
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Teléfono</label>
            <input 
              type="tel" 
              value={form.phone} 
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Ciudad</label>
            <input 
              type="text" 
              value={form.city} 
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Descripción del Negocio</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]" 
              placeholder="Cuenta a tus clientes sobre tu negocio..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Ubicación Exacta (Google Maps URL)</label>
            <input 
              type="url" 
              value={form.google_maps_url} 
              onChange={e => setForm(p => ({ ...p, google_maps_url: e.target.value }))}
              className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
              placeholder="https://goo.gl/maps/..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">WhatsApp de Contacto Directo</label>
            <input 
              type="text" 
              value={form.whatsapp_number} 
              onChange={e => setForm(p => ({ ...p, whatsapp_number: e.target.value }))}
              className="w-full bg-dark-bg border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
              placeholder="Ej: 593987654321"
            />
          </div>
        </div>
      </section>

      {/* Pagos y QR */}
      <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Métodos de Pago y QR</h2>
            <p className="text-gray-500 text-sm mb-6">Configura cómo recibes los pagos por transferencia.</p>
            
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
              <input 
                type="checkbox" 
                checked={form.whatsapp_direct} 
                onChange={e => setForm(p => ({ ...p, whatsapp_direct: e.target.checked }))} 
                className="w-5 h-5 accent-blue-600 rounded" 
              />
              <div>
                <span className="text-white text-sm font-bold block">Redirigir a WhatsApp al completar reserva/pedido</span>
                <span className="text-gray-400 text-xs block mt-1">El cliente será enviado automáticamente a tu WhatsApp para adjuntar el comprobante de pago.</span>
              </div>
            </label>
          </div>
          
          <div className="flex flex-col items-center gap-4 bg-dark-bg p-6 rounded-2xl border border-white/5 shrink-0 w-full md:w-64">
            <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-2 relative">
              {form.qr_code_url ? (
                <img src={form.qr_code_url} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <Store size={32} className="text-gray-300 mx-auto mb-2" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sin QR</span>
                </div>
              )}
              {uploadingQr && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <label className={`w-full py-2 px-4 ${tColor.bgSubtle} ${tColor.text} rounded-lg text-sm font-bold cursor-pointer text-center hover:bg-white/10 transition-colors border ${tColor.borderSubtle}`}>
              {uploadingQr ? 'Subiendo...' : 'Subir Código QR'}
              <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={uploadingQr} />
            </label>
          </div>
        </div>
      </section>

      {/* Personalización de Tienda */}
      <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-8 shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Store className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Personalización de Tienda y Features</h2>
            <p className="text-gray-500 text-sm">Activa la venta de productos y adapta el aspecto de tu página pública.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-bg p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Venta de Productos</p>
              <p className="text-gray-500 text-xs mt-1">Habilita una tienda online integrada.</p>
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
              <p className="text-white font-semibold mb-3">Tema Visual</p>
            </div>
            <select
              value={settings.theme || 'default'}
              onChange={e => setSettings(s => ({ ...s, theme: e.target.value }))}
              className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="default">Por Defecto (Oscuro Clásico)</option>
              <option value="ocean">Océano (Azul Profundo)</option>
              <option value="forest">Bosque (Verde Esmeralda)</option>
              <option value="sunset">Atardecer (Cálido)</option>
            </select>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-4 border-t border-white/5 pt-6">Visualización en el Perfil Público</h3>
        <div className="space-y-4 mb-8">
          <label className="flex items-center justify-between bg-dark-bg p-4 rounded-xl border border-white/5 cursor-pointer">
            <div>
              <p className="text-white font-medium">Mostrar Redes Sociales</p>
              <p className="text-gray-500 text-xs">Añade botones rápidos estilo "Linktree" en tu perfil.</p>
            </div>
            <input type="checkbox" checked={settings.show_socials !== false} onChange={e => setSettings(s => ({...s, show_socials: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
          </label>
          <label className="flex items-center justify-between bg-dark-bg p-4 rounded-xl border border-white/5 cursor-pointer">
            <div>
              <p className="text-white font-medium">Mostrar Sección de Servicios</p>
              <p className="text-gray-500 text-xs">Permite a los clientes agendar citas.</p>
            </div>
            <input type="checkbox" checked={settings.show_services !== false} onChange={e => setSettings(s => ({...s, show_services: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
          </label>
          <label className="flex items-center justify-between bg-dark-bg p-4 rounded-xl border border-white/5 cursor-pointer">
            <div>
              <p className="text-white font-medium">Mostrar Tienda de Productos</p>
              <p className="text-gray-500 text-xs">Muestra tu catálogo (requiere activar la Venta de Productos primero).</p>
            </div>
            <input type="checkbox" checked={settings.show_products !== false} onChange={e => setSettings(s => ({...s, show_products: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
          </label>
        </div>

        <h3 className="text-lg font-bold text-white mb-4 border-t border-white/5 pt-6">Enlaces Sociales</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">WhatsApp (Ej: 593987654321)</label>
            <input 
              type="text" 
              value={settings.social_links?.whatsapp || ''} 
              onChange={e => setSettings(s => ({ ...s, social_links: { ...s.social_links, whatsapp: e.target.value } }))}
              className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instagram (Username o URL)</label>
            <input 
              type="text" 
              value={settings.social_links?.instagram || ''} 
              onChange={e => setSettings(s => ({ ...s, social_links: { ...s.social_links, instagram: e.target.value } }))}
              className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Facebook (URL)</label>
            <input 
              type="text" 
              value={settings.social_links?.facebook || ''} 
              onChange={e => setSettings(s => ({ ...s, social_links: { ...s.social_links, facebook: e.target.value } }))}
              className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sitio Web URL</label>
            <input 
              type="text" 
              value={settings.social_links?.website || ''} 
              onChange={e => setSettings(s => ({ ...s, social_links: { ...s.social_links, website: e.target.value } }))}
              className="w-full bg-dark-bg border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" 
            />
          </div>
        </div>
      </section>

      {/* Horarios */}
      <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-10 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Horarios de Atención</h2>
        </div>

        <div className="space-y-4">
          {localHours.map((h) => (
            <div key={h.day_of_week} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${h.is_closed ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-dark-bg border-white/5'}`}>
              <div className="w-28">
                <span className="text-sm font-semibold text-white">{days[h.day_of_week]}</span>
              </div>
              
              <div className="flex items-center gap-4 flex-1">
                {!h.is_closed ? (
                  <>
                    <input 
                      type="time" 
                      value={h.open_time.slice(0, 5)} 
                      onChange={e => updateDay(h.day_of_week, 'open_time', e.target.value)}
                      className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500/50 outline-none" 
                    />
                    <span className="text-gray-600">a</span>
                    <input 
                      type="time" 
                      value={h.close_time.slice(0, 5)} 
                      onChange={e => updateDay(h.day_of_week, 'close_time', e.target.value)}
                      className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500/50 outline-none" 
                    />
                  </>
                ) : (
                  <span className="text-sm text-gray-500 font-medium italic">Cerrado</span>
                )}
              </div>

              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                <input 
                  type="checkbox" 
                  checked={h.is_closed} 
                  onChange={e => updateDay(h.day_of_week, 'is_closed', e.target.checked)}
                  id={`closed-${h.day_of_week}`}
                  className="accent-blue-600" 
                />
                <label htmlFor={`closed-${h.day_of_week}`} className="text-xs font-bold text-gray-400 cursor-pointer">CERRADO</label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-500/5 rounded-3xl p-8 border border-red-500/20 mb-10 shadow-sm mt-12">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-red-500">Zona de Peligro</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Eliminar tu negocio borrará permanentemente todos tus datos, servicios, productos, reservas e historial. Esta acción no se puede deshacer.
        </p>
        <button 
          onClick={handleDeleteBusiness}
          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-xl font-bold transition-all"
        >
          Eliminar Negocio Permanentemente
        </button>
      </section>

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
