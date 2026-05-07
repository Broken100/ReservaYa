import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, MessageSquare, Eye, EyeOff, Pin, PinOff, Loader2, Reply } from 'lucide-react';
import { useBusiness } from '../../hooks/useBusiness';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

type ReviewRow = {
  id: string;
  business_id: string;
  client_id: string;
  target_type: 'business' | 'service' | 'professional' | 'product';
  target_id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  hidden: boolean;
  featured: boolean;
  created_at: string;
  client?: { full_name: string | null; avatar_url: string | null } | null;
};

type TargetInfo = Record<string, string>;

const TARGET_LABELS: Record<string, string> = {
  business: 'Negocio',
  service: 'Servicio',
  professional: 'Profesional',
  product: 'Producto',
};

export default function ReviewsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [targetNames, setTargetNames] = useState<TargetInfo>({});
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (business) fetchReviews();
  }, [business]);

  const fetchReviews = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, client:profiles!reviews_client_id_fkey(id, full_name, avatar_url)')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data || []) as ReviewRow[]);

      const ids: Record<string, string[]> = { service: [], professional: [], product: [] };
      (data || []).forEach((r: ReviewRow) => {
        if (r.target_type === 'service' && r.target_id) ids.service.push(r.target_id);
        if (r.target_type === 'professional' && r.target_id) ids.professional.push(r.target_id);
        if (r.target_type === 'product' && r.target_id) ids.product.push(r.target_id);
      });

      const names: TargetInfo = {};
      if (ids.service.length) {
        const { data: svcs } = await supabase.from('services').select('id, name').in('id', ids.service);
        (svcs || []).forEach((s: { id: string; name: string }) => { names[s.id] = s.name; });
      }
      if (ids.professional.length) {
        const { data: profs } = await supabase.from('professionals').select('id, name').in('id', ids.professional);
        (profs || []).forEach((p: { id: string; name: string }) => { names[p.id] = p.name; });
      }
      if (ids.product.length) {
        const { data: prods } = await supabase.from('products').select('id, name').in('id', ids.product);
        (prods || []).forEach((p: { id: string; name: string }) => { names[p.id] = p.name; });
      }
      setTargetNames(names);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ reply: replyText.trim() })
        .eq('id', reviewId);
      if (error) throw error;
      toast.success(t('reviews.replySuccess'));
      setReplyingTo(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      toast.error(t('reviews.replyError'));
    }
  };

  const toggleHidden = async (reviewId: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ hidden: !current })
        .eq('id', reviewId);
      if (error) throw error;
      toast.success(current ? t('reviews.showSuccess') : t('reviews.hideSuccess'));
      fetchReviews();
    } catch (err) {
      toast.error(t('reviews.updateError'));
    }
  };

  const toggleFeatured = async (reviewId: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ featured: !current })
        .eq('id', reviewId);
      if (error) throw error;
      toast.success(current ? t('reviews.unfeatureSuccess') : t('reviews.featureSuccess'));
      fetchReviews();
    } catch (err) {
      toast.error(t('reviews.updateError'));
    }
  };

  const stats = (() => {
    const activeReviews = reviews.filter(r => !r.hidden);
    const ratings = activeReviews.map(r => r.rating);
    const avg = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { dist[r] = (dist[r] || 0) + 1; });
    return { average: avg, count: ratings.length, hidden: reviews.filter(r => r.hidden).length, distribution: dist };
  })();

  const filteredReviews = reviews.filter(r => {
    if (filterRating && r.rating !== filterRating) return false;
    if (filterType && r.target_type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-white mb-6">{t('reviews.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-dark-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
            <span className="text-3xl font-bold text-white">{stats.average}</span>
          </div>
          <p className="text-gray-500 text-sm">{t('reviews.averageRating')}</p>
        </div>
        <div className="bg-dark-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className="text-blue-400" />
            <span className="text-3xl font-bold text-white">{stats.count}</span>
          </div>
          <p className="text-gray-500 text-sm">{t('reviews.totalReviews')}</p>
        </div>
        <div className="bg-dark-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <EyeOff size={20} className="text-gray-400" />
            <span className="text-3xl font-bold text-white">{stats.hidden}</span>
          </div>
          <p className="text-gray-500 text-sm">{t('reviews.hiddenCount')}</p>
        </div>
      </div>

      <div className="bg-dark-card rounded-2xl p-6 border border-white/5 mb-8">
        <h3 className="text-white font-bold mb-4">{t('reviews.distribution')}</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-gray-400 text-sm w-4">{star}</span>
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all"
                  style={{ width: `${stats.count > 0 ? ((stats.distribution[star] || 0) / stats.count) * 100 : 0}%` }}
                />
              </div>
              <span className="text-gray-500 text-sm w-8">{stats.distribution[star] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterRating(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${!filterRating ? 'bg-blue-600 text-white border-blue-500' : 'bg-dark-card text-gray-400 border-white/5 hover:border-white/20'}`}
        >
          {t('reviews.allRatings')}
        </button>
        {[5, 4, 3, 2, 1].map(star => (
          <button
            key={star}
            onClick={() => setFilterRating(filterRating === star ? null : star)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${filterRating === star ? 'bg-blue-600 text-white border-blue-500' : 'bg-dark-card text-gray-400 border-white/5 hover:border-white/20'}`}
          >
            {star} <Star size={10} className={filterRating === star ? 'fill-white' : 'fill-yellow-400 text-yellow-400'} />
          </button>
        ))}
        <div className="w-px bg-white/10 mx-1" />
        <button
          onClick={() => setFilterType(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${!filterType ? 'bg-blue-600 text-white border-blue-500' : 'bg-dark-card text-gray-400 border-white/5 hover:border-white/20'}`}
        >
          {t('reviews.allTypes')}
        </button>
        {['business', 'service', 'professional', 'product'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(filterType === type ? null : type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterType === type ? 'bg-blue-600 text-white border-blue-500' : 'bg-dark-card text-gray-400 border-white/5 hover:border-white/20'}`}
          >
            {t(`reviews.type_${type}`)}
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="bg-dark-card rounded-3xl p-12 border border-white/5 text-center">
          <MessageSquare size={40} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('reviews.noReviews')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => {
            const isReplying = replyingTo === review.id;
            return (
              <div key={review.id} className={`bg-dark-card rounded-2xl border p-6 transition-all ${review.hidden ? 'border-red-500/20 opacity-60' : review.featured ? 'border-yellow-500/30' : 'border-white/5'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {review.client?.avatar_url ? (
                        <img src={review.client.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                          {(review.client?.full_name || 'C')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-white font-medium">{review.client?.full_name || 'Cliente'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${review.target_type === 'service' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : review.target_type === 'professional' ? 'bg-green-500/10 text-green-400 border-green-500/20' : review.target_type === 'product' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {TARGET_LABELS[review.target_type]}{review.target_type !== 'business' && targetNames[review.target_id] ? `: ${targetNames[review.target_id]}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-gray-400 text-sm mb-2 leading-relaxed">"{review.comment}"</p>
                    )}
                    {review.reply && (
                      <div className="mt-2 p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl">
                        <p className="text-blue-400 text-xs font-medium mb-1">{t('reviews.ownerReply')}</p>
                        <p className="text-gray-400 text-xs">{review.reply}</p>
                      </div>
                    )}
                    <p className="text-gray-600 text-xs mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {review.featured ? (
                      <button onClick={() => toggleFeatured(review.id, true)} className="p-2 rounded-lg hover:bg-yellow-500/10 text-yellow-400 transition-colors" title={t('reviews.unfeature')}>
                        <PinOff size={16} />
                      </button>
                    ) : (
                      <button onClick={() => toggleFeatured(review.id, false)} className="p-2 rounded-lg hover:bg-yellow-500/10 text-gray-500 hover:text-yellow-400 transition-colors" title={t('reviews.feature')}>
                        <Pin size={16} />
                      </button>
                    )}
                    {review.hidden ? (
                      <button onClick={() => toggleHidden(review.id, true)} className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors" title={t('reviews.show')}>
                        <Eye size={16} />
                      </button>
                    ) : (
                      <button onClick={() => toggleHidden(review.id, false)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title={t('reviews.hide')}>
                        <EyeOff size={16} />
                      </button>
                    )}
                    <button onClick={() => { setReplyingTo(isReplying ? null : review.id); setReplyText(review.reply || ''); }} className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition-colors" title={t('reviews.reply')}>
                      <Reply size={16} />
                    </button>
                  </div>
                </div>

                {isReplying && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={t('reviews.replyPlaceholder')}
                      className="flex-1 bg-dark-bg border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={() => handleReply(review.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      {t('reviews.sendReply')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
