import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { useReviews } from '../../hooks/useReviews';
import { supabase } from '../../lib/supabaseClient';
import { Heart, MapPin, Building2, Sparkles, User, Package, Loader2, Star, X, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FavoriteButton from '../../components/ui/FavoriteButton';
import { toast } from 'sonner';

type Business = { id: string; name: string; slug: string; category: string | null; city: string | null; logo_url: string | null; description: string | null };
type ServiceDetail = { id: string; name: string; price: number; duration_minutes: number; description: string | null; image_url: string | null; category: string | null; business_id: string; businesses?: { name: string; slug: string } | null };
type ProfessionalDetail = { id: string; name: string; full_name: string | null; specialty: string | null; avatar_url: string | null; bio: string | null; years_experience: number | null; business_id: string; businesses?: { name: string; slug: string } | null };
type ProductDetail = { id: string; name: string; price: number; description: string | null; image_url: string | null; category: string | null; stock: number; business_id: string; businesses?: { name: string; slug: string } | null };

type TabKey = 'all' | 'businesses' | 'services' | 'professionals' | 'products';
type DetailTarget = { type: 'service' | 'professional' | 'product'; id: string } | null;

const tabs: { key: TabKey; icon: typeof Heart; labelKey: string }[] = [
  { key: 'all', icon: Heart, labelKey: 'favorites.all' },
  { key: 'businesses', icon: Building2, labelKey: 'favorites.businesses' },
  { key: 'services', icon: Sparkles, labelKey: 'favorites.services' },
  { key: 'professionals', icon: User, labelKey: 'favorites.professionals' },
  { key: 'products', icon: Package, labelKey: 'favorites.products' },
];

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { favorites, loading, toggleFavorite, isFavorited } = useFavorites(user?.id ?? null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [details, setDetails] = useState<{ businesses: Business[]; services: ServiceDetail[]; professionals: ProfessionalDetail[]; products: ProductDetail[] }>({
    businesses: [], services: [], professionals: [], products: []
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailTarget, setDetailTarget] = useState<DetailTarget>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

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
        svcIds.length ? supabase.from('services').select('id, name, price, duration_minutes, description, image_url, category, business_id, businesses(name, slug)').in('id', svcIds) : { data: [] },
        profIds.length ? supabase.from('professionals').select('id, name, full_name, specialty, avatar_url, bio, years_experience, business_id, businesses(name, slug)').in('id', profIds) : { data: [] },
        prodIds.length ? supabase.from('products').select('id, name, price, description, image_url, category, stock, business_id, businesses(name, slug)').in('id', prodIds) : { data: [] },
      ]);
      if (!cancelled) {
        setDetails({
          businesses: (bizRes.data as Business[]) || [],
          services: (svcRes.data as ServiceDetail[]) || [],
          professionals: (profRes.data as ProfessionalDetail[]) || [],
          products: (prodRes.data as ProductDetail[]) || [],
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

  const getBusiness = (id: string) => details.businesses.find(b => b.id === id);
  const getService = (id: string) => details.services.find(s => s.id === id);
  const getProfessional = (id: string) => details.professionals.find(p => p.id === id);
  const getProduct = (id: string) => details.products.find(p => p.id === id);

  const getDetailEntity = () => {
    if (!detailTarget) return null;
    if (detailTarget.type === 'service') return { entity: getService(detailTarget.id), type: 'service' as const };
    if (detailTarget.type === 'professional') return { entity: getProfessional(detailTarget.id), type: 'professional' as const };
    if (detailTarget.type === 'product') return { entity: getProduct(detailTarget.id), type: 'product' as const };
    return null;
  };

  const detail = getDetailEntity();
  const detailEntity = detail?.entity;
  const detailBusinessId = detailEntity ? (detailEntity as any).business_id : null;
  const detailBusinessSlug = detailEntity ? (detailEntity as any).businesses?.slug : null;

  const { stats: reviewStats } = useReviews(detailBusinessId, detailTarget?.type, detailTarget?.id);

  const handleSubmitReview = async () => {
    if (!detailTarget || !detailEntity || !user || reviewRating === 0) return;
    const businessId = (detailEntity as any).business_id;
    if (!businessId) return;
    setReviewSaving(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        business_id: businessId,
        client_id: user.id,
        target_type: detailTarget.type,
        target_id: detailTarget.id,
        rating: reviewRating,
        comment: reviewText || null,
      });
      if (error) {
        if (error.code === '23505') {
          toast.error(t('reviews.alreadyReviewed'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('myBookings.feedback.thanks'));
      }
      setShowReview(false);
      setReviewRating(0);
      setReviewText('');
    } catch (err: any) {
      toast.error(t('myBookings.feedback.error') + ': ' + (err.message || ''));
    } finally {
      setReviewSaving(false);
    }
  };

  const renderEmpty = (key: string) => (
    <div className="bg-dark-card rounded-3xl p-12 border border-white/5 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Heart className="w-8 h-8 text-gray-500" />
      </div>
      <p className="text-gray-400 text-lg">{t(key)}</p>
    </div>
  );

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
                <div key={fav.id} onClick={() => navigate(`/reservar/${biz.slug}`)} className="cursor-pointer group bg-dark-card border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ businessId: fav.business_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shrink-0 overflow-hidden">
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
                </div>
              );
            }
            if (type === 'services' && fav.service_id) {
              const svc = getService(fav.service_id);
              if (!svc) return null;
              return (
                <div key={fav.id} onClick={() => setDetailTarget({ type: 'service', id: fav.service_id! })} className="cursor-pointer group bg-dark-card border border-white/5 hover:border-purple-500/50 rounded-3xl p-6 transition-all hover:shadow-xl flex flex-col h-full relative">
                  <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ serviceId: fav.service_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                      {svc.image_url ? <img src={svc.image_url} alt={svc.name} className="w-full h-full object-cover rounded-xl" /> : <Sparkles size={18} className="text-purple-400" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors truncate">{svc.name}</h3>
                      {svc.businesses?.name && <p className="text-sm text-gray-500 truncate">{svc.businesses.name}</p>}
                    </div>
                  </div>
                  {svc.description && <p className="text-gray-500 text-sm line-clamp-2 mb-2 flex-1">{svc.description}</p>}
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <span className="text-blue-400 font-bold">${svc.price.toFixed(2)}</span>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={12} />
                      <span>{svc.duration_minutes} min</span>
                    </div>
                  </div>
                </div>
              );
            }
            if (type === 'professionals' && fav.professional_id) {
              const prof = getProfessional(fav.professional_id);
              if (!prof) return null;
              return (
                <div key={fav.id} onClick={() => setDetailTarget({ type: 'professional', id: fav.professional_id! })} className="cursor-pointer group bg-dark-card border border-white/5 hover:border-green-500/50 rounded-3xl p-6 transition-all hover:shadow-xl flex flex-col h-full relative">
                  <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ professionalId: fav.professional_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                      {prof.avatar_url ? <img src={prof.avatar_url} alt={prof.name} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-green-400">{prof.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors truncate">{prof.name}</h3>
                      {prof.specialty && <p className="text-sm text-gray-500 truncate">{prof.specialty}</p>}
                    </div>
                  </div>
                  {prof.bio && <p className="text-gray-500 text-sm line-clamp-2 mb-2 flex-1">{prof.bio}</p>}
                  {prof.businesses?.name && (
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-gray-500 text-sm">
                      <Building2 size={14} />
                      <span>{prof.businesses.name}</span>
                    </div>
                  )}
                </div>
              );
            }
            if (type === 'products' && fav.product_id) {
              const prod = getProduct(fav.product_id);
              if (!prod) return null;
              return (
                <div key={fav.id} onClick={() => setDetailTarget({ type: 'product', id: fav.product_id! })} className="cursor-pointer group bg-dark-card border border-white/5 hover:border-amber-500/50 rounded-3xl p-6 transition-all hover:shadow-xl flex flex-col h-full relative">
                  <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                    <FavoriteButton isFavorited onToggle={() => toggleFavorite({ productId: fav.product_id! })} size={18} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                      {prod.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" /> : <Package size={20} className="text-amber-400" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors truncate">{prod.name}</h3>
                      {prod.category && <span className="text-xs text-gray-500">{prod.category}</span>}
                    </div>
                  </div>
                  {prod.description && <p className="text-gray-500 text-sm line-clamp-2 mb-2 flex-1">{prod.description}</p>}
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <span className="text-blue-400 font-bold">${prod.price.toFixed(2)}</span>
                    {prod.businesses?.name && (
                      <span className="text-gray-500 flex items-center gap-1"><Building2 size={14} />{prod.businesses.name}</span>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailTarget && detailEntity && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => { setDetailTarget(null); setShowReview(false); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-dark-card border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{(detailEntity as any).name}</h3>
                <button onClick={() => { setDetailTarget(null); setShowReview(false); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              {/* Image / Avatar */}
              {detailTarget.type === 'service' && (detailEntity as ServiceDetail).image_url && (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video">
                  <img src={(detailEntity as ServiceDetail).image_url!} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {detailTarget.type === 'professional' && (
                <div className="flex items-center gap-4 mb-4">
                  {(detailEntity as ProfessionalDetail).avatar_url ? (
                    <img src={(detailEntity as ProfessionalDetail).avatar_url!} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center text-green-400 text-2xl font-bold">{(detailEntity as ProfessionalDetail).name.charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    {(detailEntity as ProfessionalDetail).full_name && <p className="text-white font-medium">{(detailEntity as ProfessionalDetail).full_name}</p>}
                    {(detailEntity as ProfessionalDetail).specialty && <p className="text-gray-500 text-sm">{(detailEntity as ProfessionalDetail).specialty}</p>}
                    {(detailEntity as ProfessionalDetail).years_experience != null && <p className="text-gray-500 text-xs">{(detailEntity as ProfessionalDetail).years_experience} {t('booking.years')}</p>}
                  </div>
                </div>
              )}
              {detailTarget.type === 'product' && (detailEntity as ProductDetail).image_url && (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video">
                  <img src={(detailEntity as ProductDetail).image_url!} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Description */}
              {(detailEntity as any).description && (
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{(detailEntity as any).description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {detailTarget.type === 'service' && (
                  <>
                    <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('booking.price')}</p>
                      <p className="text-blue-400 font-bold">${(detailEntity as ServiceDetail).price.toFixed(2)}</p>
                    </div>
                    <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('booking.selectService')}</p>
                      <p className="text-white text-sm">{(detailEntity as ServiceDetail).duration_minutes} min</p>
                    </div>
                  </>
                )}
                {detailTarget.type === 'product' && (
                  <>
                    <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('booking.price')}</p>
                      <p className="text-blue-400 font-bold">${(detailEntity as ProductDetail).price.toFixed(2)}</p>
                    </div>
                    <div className="bg-dark-bg rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t('booking.cart.stock')}</p>
                      <p className="text-white text-sm">{(detailEntity as ProductDetail).stock > 0 ? t('booking.stockAvailable', { count: (detailEntity as ProductDetail).stock }) : t('booking.stockOut')}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Bio for professional */}
              {detailTarget.type === 'professional' && (detailEntity as ProfessionalDetail).bio && (
                <div className="bg-dark-bg rounded-xl p-3 border border-white/5 mb-4">
                  <p className="text-gray-400 text-sm italic">&ldquo;{(detailEntity as ProfessionalDetail).bio}&rdquo;</p>
                </div>
              )}

              {/* Business */}
              {(detailEntity as any).businesses?.name && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <Building2 size={14} />
                  <span>{(detailEntity as any).businesses.name}</span>
                </div>
              )}

              {/* Review stats */}
              {reviewStats.count > 0 && (
                <div className="flex items-center gap-3 mb-4 bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= Math.round(reviewStats.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                    ))}
                  </div>
                  <span className="text-yellow-400 font-bold text-sm">{reviewStats.average}</span>
                  <span className="text-gray-500 text-xs">({reviewStats.count})</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {detailBusinessSlug && (
                  <button onClick={() => navigate(`/reservar/${detailBusinessSlug}`)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors">
                    <ArrowRight size={16} />
                    {t('favorites.goToReserve')}
                  </button>
                )}
                {user && (
                  <button onClick={() => setShowReview(true)} className="flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 py-3 px-4 rounded-xl font-bold transition-colors">
                    <Star size={16} />
                    {t('favorites.leaveReview')}
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReview && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setReviewRating(s)} className="transition-transform hover:scale-125">
                        <Star size={32} className={s <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    rows={3}
                    placeholder={t('myBookings.feedback.placeholder')}
                    className="w-full bg-dark-bg border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none mb-3"
                  />
                  <button onClick={handleSubmitReview} disabled={reviewRating === 0 || reviewSaving} className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {reviewSaving ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    {t('myBookings.feedback.send')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}