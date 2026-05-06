import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Loader2, Package, Search, Image as ImageIcon, CheckCircle, XCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts } from '../../hooks/useProducts';
import { useBusiness } from '../../hooks/useBusiness';
import { uploadPublicAsset } from '../../lib/storage';
import { useTheme } from '../../hooks/useTheme';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts(business?.id ?? null);
  const { tColor } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, stock: 0, image_url: '', is_active: true, category: '', key_features: '', instructions: '' });
  const [search, setSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: 0, stock: 0, image_url: '', is_active: true, category: '', key_features: '', instructions: '' });
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      stock: p.stock,
      image_url: p.image_url || '',
      is_active: p.is_active,
      category: p.category || '',
      key_features: p.key_features?.join(', ') || '',
      instructions: p.instructions || ''
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadPublicAsset(file, 'products');
      if (url) setForm(prev => ({ ...prev, image_url: url }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        key_features: form.key_features ? form.key_features.split(',').map(f => f.trim()).filter(Boolean) : null,
        category: form.category || null,
        instructions: form.instructions || null,
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(t('products.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('products.deleteConfirm'))) {
      try {
        await deleteProduct(id);
      } catch (err) {
        toast.error(t('products.errorDelete'));
      }
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className={`animate-spin ${tColor.text}`} /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={24} className={tColor.text} />
            {t('products.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('products.subtitle')}</p>
        </div>
        <button
          onClick={openNew}
          className={`flex items-center gap-2 ${tColor.bg} text-white px-5 py-2.5 rounded-xl font-bold ${tColor.bgHover} transition-colors shadow-lg ${tColor.shadow}`}
        >
          <Plus size={20} />
          {t('products.create')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder={t('products.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-dark-card border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-card rounded-3xl border border-white/5 p-12 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('products.notFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <div key={p.id} className={`bg-dark-card border rounded-3xl overflow-hidden transition-all group ${p.is_active ? 'border-white/5 hover:border-blue-500/30' : 'border-white/5 opacity-60'}`}>
              <div className="aspect-square bg-dark-bg relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={40} className="text-white/10" />
                  </div>
                )}
                {!p.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{t('products.soldOut')}</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white truncate">{p.name}</h3>
                      {p.category && (
                        <span className="shrink-0 text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">{p.category}</span>
                      )}
                    </div>
                  </div>
                  <p className={`${tColor.text} font-bold shrink-0`}>${p.price.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{p.description || t('products.noDescription')}</p>
                {p.key_features && p.key_features.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.key_features.slice(0, 2).map((feat, i) => (
                      <span key={i} className="text-[10px] font-medium text-gray-300 bg-white/5 px-2 py-0.5 rounded-full">{feat}</span>
                    ))}
                    {p.key_features.length > 2 && (
                      <span className="text-[10px] font-medium text-gray-500">...+{p.key_features.length - 2} more</span>
                    )}
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-bold text-gray-400">{t('products.stock')}: {p.stock}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className={`p-2 bg-white/5 ${tColor.bgSubtleHover} text-gray-400 hover:${tColor.text} rounded-lg transition-colors`}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Slide-over for Create/Edit */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-card">
              <h2 className="text-xl font-bold text-white">{editingId ? t('products.editTitle') : t('products.createTitle')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Image Upload */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-dark-card border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center overflow-hidden relative group">
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
                    <Camera className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('products.form.imageHint')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('products.form.name')}</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('products.form.description')}</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('products.form.category')}</label>
                  <input type="text" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} placeholder={t('products.form.categoryPlaceholder')} className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('products.form.keyFeatures')}</label>
                  <input type="text" value={form.key_features} onChange={e => setForm(f => ({...f, key_features: e.target.value}))} placeholder={t('products.form.keyFeaturesPlaceholder')} className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('products.form.instructions')}</label>
                  <textarea value={form.instructions} onChange={e => setForm(f => ({...f, instructions: e.target.value}))} rows={3} placeholder={t('products.form.instructionsPlaceholder')} className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('products.form.price')}</label>
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value)}))} className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('products.form.stock')}</label>
                    <input type="number" value={form.stock} onChange={e => setForm(f => ({...f, stock: parseInt(e.target.value, 10)}))} className="w-full bg-dark-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <label className="flex items-center gap-3 bg-dark-card p-4 rounded-xl border border-white/5 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="w-5 h-5 accent-blue-600 rounded" />
                  <div>
                    <p className="text-white font-medium">{t('products.form.active')}</p>
                    <p className="text-gray-500 text-xs">{t('products.form.activeHelp')}</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-dark-card">
              <button
                onClick={handleSave}
                disabled={saving || !form.name || form.price < 0}
                className={`w-full flex items-center justify-center gap-2 ${tColor.bg} text-white py-4 rounded-xl font-bold ${tColor.bgHover} transition-colors disabled:opacity-50`}
              >
                {saving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                {editingId ? t('products.saveChanges') : t('products.createButton')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
