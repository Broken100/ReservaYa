import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { supabase } from '../../lib/supabaseClient';
import { Heart, MapPin, Building2, Sparkles, User, Package, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import FavoriteButton from '../../components/ui/FavoriteButton';

type Business = { id: string; name: string; slug: string; category: string | null; city: string | null; logo_url: string | null; description: string | null };
type Service = { id: string; name: string; price: number; duration_minutes: number; business_id: string; businesses?: { name: string; slug: string } | null };
type Professional = { id: string; name: string; specialty: string | null; avatar_url: string | null; business_id: string; businesses?: { name: string; slug: string } | null };
type Product = { id: string; name: string; price: number; image_url: string | null; business_id: string; businesses?: { name: string; slug: string } | null };

type TabKey = 'all' | 'businesses' | 'services' | 'professionals' | 'products';

const tabs: { key: TabKey; icon: typeof Heart; labelKey: string }[] = [
  { key: 'all', icon: Heart, labelKey: 'favorites.all' },
  { key: 'businesses', icon: Building2, labelKey: 'favorites.businesses' },
  { key: 'services', icon: Sparkles, labelKey: 'favorites.services' },
  { key: 'professionals', icon: User, labelKey: 'favorites.professionals' },
  { key: 'products', icon: Package, labelKey: 'favorites.products' },
];

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { favorites, loading, toggleFavorite, isFavorited } = useFavorites(profile?.id ?? null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [details, setDetails] = useState<{ businesses: Business[]; services: Service[]; professionals: Professional[]; products: Product[] }>({
    businesses: [], services: [], professionals: [], products: []
  });
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (!favorites.length) return;
    let cancelled = false;
    const load = async () => {
      setDetailsLoading(true);
      const bizIds = favorites.filter(f => f.business_id).map(f => f.business_id!);
      const svcIds = favorites.filter(f => f.service_id).map(f => f.service_id!);
      const profIds = favorites.filter(f => f.professional_id).map(f => f.professional_id!);
      const prodIds = favorites.filter(f => f.product_id).map(f => f.product_id!);
      const [bizRes, svcRes, profRes, prodRes] = await Promise.all([
        bizIds.length ? supabase.from('businesses').select('id, name, slug, category, city, logo_url, description').in('id', bizIds) : { data: [] },
        svcIds.length ? supabase.from('services').select('id, name, price, duration_minutes, business_id, businesses(name, slug)').in('id', svcIds) : { data: [] },
        profIds.length ? supabase.from('professionals').select('id, name, specialty, avatar_url, business_id, businesses(name, slug)').in('id', profIds) : { data: [] },
        prodIds.length ? supabase.from('products').select('id, name, price, image_url, business_id, businesses(name, slug)').in('id', prodIds) : { data: [] },
      ]);
      if (!cancelled) {
        setDetails({
          businesses: (bizRes.data as Business[]) || [],
          services: (svcRes.data as Service[]) || [],
          professionals: (profRes.data as Professional[]) || [],
          products: (prodRes.data as Product[]) || [],
        });
        setDetailsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [favorites.length]);

  const bizFavs = favorites.filter(f => f.business_id);
  const svcFavs = favorites.filter(f => f.service_id);
  const profFavs = favorites.filter(f => f.professional_id);
  const prodFavs = favorites.filter(f => f.product_id);

  const filtered: { type: TabKey; fav: typeof favorites[0] }[] = (() => {
    const items: { type: TabKey; fav: typeof favorites[0] }[] = [];
    if (activeTab === 'all' || activeTab === 'businesses') bizFavs.forEach(f => items.push({ type: 'businesses', fav: f }));
    if (activeTab === 'all' || activeTab === 'services') svcFavs.forEach(f => items.push({ type: 'services', fav: f }));
    if (activeTab === 'all' || activeTab === 'professionals') profFavs.forEach(f => items.push({ type: 'professionals', fav: f }));
    if (activeTab === 'all' || activeTab === 'products') prodFavs.forEach(f => items.push({ type: 'products', fav: f }));
    return items;
  })();

  const renderEmpty = (key: string) => (
    <div className="bg-dark-card rounded-3xl p-12 border border-white/5 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Heart className="w-8 h-8 text-gray-500" />
      </div>
      <p className="text-gray-400 text-lg">{t(key)}</p>
    </div>
  );

  const getBusiness = (id: string) => details.businesses.find(b => b.id === id);
  const getService = (id: string) => details.services.find(s => s.id === id);
  const getProfessional = (id: string) => details.professionals.find(p => p.id === id);
  const getProduct = (id: string) => details.products.find(p => p.id === id);

  if (loading || detailsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  if (!favorites.length) return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-8">{t('favorites.title')}</h1>
      {renderEmpty('favorites.empty')}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white">{t('favorites.title')}</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        renderEmpty(
          activeTab === 'businesses' ? 'favorites.emptyBusinesses' :
          activeTab === 'services' ? 'favorites.emptyServices' :
          activeTab === 'professionals' ? 'favorites.emptyProfessionals' :
          activeTab === 'products' ? 'favorites.emptyProducts' : 'favorites.empty'
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(({ type, fav }) => {
            if (type === 'businesses' && fav.business_id) {
              const biz = getBusiness(fav.business_id);
              if (!biz) return null;
              return (
                <Link key={fav.id} to={`/reservar/${biz.slug}`} className="group bg-dark-card border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full relative">
                  <div className="absolute top-4 right-4">
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ businessId: fav.business_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                      {biz.logo_url ? <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-blue-400">{biz.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{biz.name}</h3>
                      {biz.category && <span className="text-xs font-medium text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full">{biz.category}</span>}
                    </div>
                  </div>
                  {biz.description && <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{biz.description}</p>}
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-gray-500 text-sm">
                    <MapPin size={16} />
                    <span>{biz.city || t('explore.cityUnspecified')}</span>
                  </div>
                </Link>
              );
            }
            if (type === 'services' && fav.service_id) {
              const svc = getService(fav.service_id);
              if (!svc) return null;
              const slug = svc.businesses?.slug;
              return (
                <Link key={fav.id} to={slug ? `/reservar/${slug}` : '#'} className="group bg-dark-card border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full relative">
                  <div className="absolute top-4 right-4">
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ serviceId: fav.service_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
                      <Sparkles size={18} className="text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{svc.name}</h3>
                      {svc.businesses?.name && <p className="text-sm text-gray-500 truncate">{svc.businesses.name}</p>}
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <span className="text-blue-400 font-bold">${svc.price}</span>
                    <span className="text-gray-500">{svc.duration_minutes} min</span>
                  </div>
                </Link>
              );
            }
            if (type === 'professionals' && fav.professional_id) {
              const prof = getProfessional(fav.professional_id);
              if (!prof) return null;
              const slug = prof.businesses?.slug;
              return (
                <Link key={fav.id} to={slug ? `/reservar/${slug}` : '#'} className="group bg-dark-card border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full relative">
                  <div className="absolute top-4 right-4">
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ professionalId: fav.professional_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                      {prof.avatar_url ? <img src={prof.avatar_url} alt={prof.name} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-green-400">{prof.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{prof.name}</h3>
                      {prof.specialty && <p className="text-sm text-gray-500 truncate">{prof.specialty}</p>}
                    </div>
                  </div>
                  {prof.businesses?.name && (
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-gray-500 text-sm">
                      <Building2 size={14} />
                      <span>{prof.businesses.name}</span>
                    </div>
                  )}
                </Link>
              );
            }
            if (type === 'products' && fav.product_id) {
              const prod = getProduct(fav.product_id);
              if (!prod) return null;
              const slug = prod.businesses?.slug;
              return (
                <Link key={fav.id} to={slug ? `/reservar/${slug}` : '#'} className="group bg-dark-card border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full relative">
                  <div className="absolute top-4 right-4">
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ productId: fav.product_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                      {prod.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" /> : <Package size={20} className="text-amber-400" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{prod.name}</h3>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <span className="text-blue-400 font-bold">${prod.price}</span>
                    {prod.businesses?.name && (
                      <span className="text-gray-500 flex items-center gap-1"><Building2 size={14} />{prod.businesses.name}</span>
                    )}
                  </div>
                </Link>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}