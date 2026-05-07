import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReviews, type ReviewRow } from '../../../hooks/useReviews';

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
  const { reviews, stats, loading } = useReviews(businessId);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(prev => prev < reviews.length - 1 ? prev + 1 : 0);
    }, 5000);
  };

  useEffect(() => {
    if (reviews.length > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reviews.length]);

  if (loading) {
    return (
      <div className={`${cardClass} rounded-3xl p-8 mb-8`}>
        <div className="flex items-center gap-2 mb-4">
          <Star size={20} className={`${tColor.text} animate-pulse`} />
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`${cardClass} rounded-3xl p-8 mb-8 text-center`}>
        <Star size={24} className={`mx-auto mb-2 ${tColor.text}`} />
        <p className={`${textMutedClass} text-sm`}>{t('booking.noReviews')}</p>
      </div>
    );
  }

  const goTo = (idx: number) => {
    setCurrent(idx);
    startTimer();
  };

  const prev = () => goTo(current > 0 ? current - 1 : reviews.length - 1);
  const next = () => goTo(current < reviews.length - 1 ? current + 1 : 0);

  const review = reviews[current];

  return (
    <div className={`${cardClass} rounded-3xl p-8 mb-8`}>
      <h2 className={`text-xl font-bold ${textClass} mb-4`}>{t('booking.reviews')}</h2>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={20}
              className={i < Math.round(stats.average) ? `${tColor.text} fill-current` : 'text-gray-600'}
            />
          ))}
        </div>
        <span className={`font-bold ${textClass}`}>
          {t('booking.averageRating', { rating: stats.average })}
        </span>
        <span className={`${textMutedClass} text-sm`}>
          {t('booking.reviewCount', { count: stats.count })}
        </span>
      </div>

      {review && (
        <div className={`p-6 rounded-2xl ${isMinimal ? 'bg-gray-50' : 'bg-white/5'} transition-all duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {review.client?.avatar_url ? (
                <img src={review.client.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className={`w-8 h-8 rounded-full ${tColor.bgSubtle} flex items-center justify-center text-xs font-bold ${tColor.text}`}>
                  {(review.client?.full_name || 'C')[0].toUpperCase()}
                </div>
              )}
              <span className={`font-medium ${textClass}`}>{review.client?.full_name || 'Cliente'}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < review.rating ? `${tColor.text} fill-current` : 'text-gray-600'} />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className={`${textMutedClass} text-sm leading-relaxed mb-2`}>"{review.comment}"</p>
          )}
          {review.reply && (
            <div className={`mt-2 p-3 rounded-xl ${isMinimal ? 'bg-gray-100' : 'bg-white/5'} border-l-2 ${tColor.borderSubtle}`}>
              <p className={`text-xs ${tColor.text} font-medium mb-1`}>{t('booking.ownerReply')}</p>
              <p className={`${textMutedClass} text-xs`}>{review.reply}</p>
            </div>
          )}
          <p className={`${textMutedClass} text-xs mt-2 opacity-60`}>
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {reviews.length > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button onClick={prev} className={`p-2 rounded-xl ${isMinimal ? 'hover:bg-gray-100' : 'hover:bg-white/5'} transition-colors ${textMutedClass}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? tColor.bg : 'bg-white/20'}`}
              />
            ))}
          </div>
          <button onClick={next} className={`p-2 rounded-xl ${isMinimal ? 'hover:bg-gray-100' : 'hover:bg-white/5'} transition-colors ${textMutedClass}`}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}