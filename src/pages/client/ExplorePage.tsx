import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { Search, MapPin, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Business = {
  id: string;
  name: string;
  category: string;
  city: string;
  slug: string;
  logo_url: string | null;
};

export default function ExplorePage() {
  const { t } = useTranslation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, category, city, slug, logo_url')
          .order('name');
        
        if (error) throw error;
        setBusinesses(data || []);
      } catch (err) {
        console.error('Error fetching businesses:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t('explore.title')}</h1>
          <p className="text-gray-400">{t('explore.subtitle')}</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder={t('explore.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-card border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
          />
        </div>
      </div>

      {!loading && businesses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSearch('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${search === '' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            {t('explore.all')}
          </button>
          {Array.from(new Set(businesses.map(b => b.category))).filter(Boolean).map(cat => (
            <button
              key={cat}
              onClick={() => setSearch(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${search === cat ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>

      ) : filteredBusinesses.length === 0 ? (
        <div className="bg-dark-card rounded-3xl p-12 border border-white/5 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg">{t('explore.noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Link 
              key={business.id} 
              to={`/reservar/${business.slug}`}
              className="group bg-dark-card border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                <ChevronRight className="text-blue-400" />
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-blue-400">{business.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{business.name}</h3>
                  <p className="text-sm text-gray-400 font-medium">{business.category}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin size={16} />
                  <span>{business.city || t('explore.cityUnspecified')}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{t('explore.reserve')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
