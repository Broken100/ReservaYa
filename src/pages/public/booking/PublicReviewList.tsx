import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

interface Review {
  id: string;
  clientName: string;
  rating: number;
  review: string | null;
  date: string;
}

interface PublicReviewListProps {
  businessId: string;
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  isMinimal: boolean;
  tColor: {
    text: string;
    textLight: string;
    bg: string;
    bgHover: string;
    borderSubtle: string;
    bgSubtle: string;
    bgSubtleHover: string;
  };
}

export default function PublicReviewList({ businessId, textClass, textMutedClass, cardClass, isMinimal, tColor }: PublicReviewListProps) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    async function fetchReviews() {
      const [bookingsRes, ordersRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, rating, review, created_at, client_id')
          .eq('business_id', businessId)
          .not('rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('orders')
          .select('id, rating, review, created_at, client_id')
          .eq('business_id', businessId)
          .not('rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const allRatings: { id: string; rating: number; review: string | null; created_at: string; client_id: string; source: string }[] = [];

      (bookingsRes.data || []).forEach((b: { id: string; rating: number; review: string | null; created_at: string; client_id: string }) => {
        allRatings.push({ id: `b-${b.id}`, rating: b.rating, review: b.review, created_at: b.created_at, client_id: b.client_id, source: 'booking' });
      });
      (ordersRes.data || []).forEach((o: { id: string; rating: number; review: string | null; created_at: string; client_id: string }) => {
        allRatings.push({ id: `o-${o.id}`, rating: o.rating, review: o.review, created_at: o.created_at, client_id: o.client_id, source: 'order' });
      });

      allRatings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const recent = allRatings.slice(0, 5);

      const clientIds = [...new Set(recent.map(r => r.client_id))];
      let clientNames: Record<string, string> = {};

      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', clientIds);
        (profiles || []).forEach((p: { id: string; full_name: string | null }) => {
          clientNames[p.id] = p.full_name || 'Cliente';
        });
      }

      const mapped: Review[] = recent.map(r => ({
        id: r.id,
        clientName: clientNames[r.client_id] || 'Cliente',
        rating: r.rating,
        review: r.review,
        date: r.created_at,
      }));

      setReviews(mapped);

      const totalRatings = bookingsRes.data?.length || 0 + ordersRes.data?.length || 0;
      const allBookingRatings = (bookingsRes.data || []).map((b: { rating: number }) => b.rating);
      const allOrderRatings = (ordersRes.data || []).map((o: { rating: number }) => o.rating);
      const combined = [...allBookingRatings, ...allOrderRatings];
      setAverageRating(combined.length > 0 ? Math.round((combined.reduce((a: number, b: number) => a + b, 0) / combined.length) * 10) / 10 : 0);
    }

    fetchReviews();
  }, [businessId]);

  if (reviews.length === 0) {
    return (
      <div className={`${cardClass} rounded-3xl p-8 mb-8 text-center`}>
        <Star size={24} className={`mx-auto mb-2 ${textMutedClass}`} />
        <p className={`${textMutedClass} text-sm`}>{t('booking.noReviews')}</p>
      </div>
    );
  }

  return (
    <div className={`${cardClass} rounded-3xl p-8 mb-8`}>
      <h2 className={`text-xl font-bold ${textClass} mb-4`}>{t('booking.reviews')}</h2>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={20}
              className={i < Math.round(averageRating) ? `${tColor.text} fill-current` : 'text-gray-600'}
            />
          ))}
        </div>
        <span className={`font-bold ${textClass}`}>
          {t('booking.averageRating', { rating: averageRating })}
        </span>
        <span className={`${textMutedClass} text-sm`}>
          {t('booking.reviewCount', { count: reviews.length })}
        </span>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className={`p-4 rounded-2xl ${isMinimal ? 'bg-gray-50' : 'bg-white/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium text-sm ${textClass}`}>{review.clientName}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < review.rating ? `${tColor.text} fill-current` : 'text-gray-600'}
                  />
                ))}
              </div>
            </div>
            {review.review && (
              <p className={`${textMutedClass} text-sm leading-relaxed`}>{review.review}</p>
            )}
            <p className={`${textMutedClass} text-xs mt-2 opacity-60`}>
              {new Date(review.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}