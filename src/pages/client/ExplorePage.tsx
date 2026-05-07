import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { Search, MapPin, Building2, ChevronRight, Loader2, SlidersHorizontal, X, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteButton from '../../components/ui/FavoriteButton';

type Business = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  slug: string;
  logo_url: string | null;
  description: string | null;
};

export default function ExplorePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites(profile?.id ?? null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, category, city, slug, logo_url, description')
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

  const categories = useMemo(() => {
    return Array.from(new Set(businesses.map(b => b.category).filter(Boolean))).sort() as string[];
  }, [businesses]);

  const cities = useMemo(() => {
    return Array.from(new Set(businesses.map(b => b.city).filter(Boolean))).sort() as string[];
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    let result = businesses.filter(b => {
      const matchesSearch = !search || 
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category?.toLowerCase().includes(search.toLowerCase()) ||
        b.city?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || b.category === selectedCategory;
      const matchesCity = !selectedCity || b.city === selectedCity;
      return matchesSearch && matchesCategory && matchesCity;
    });

    if (sortBy === 'recent') {
      result = [...result].reverse();
    }

    return result;
  }, [businesses, search, selectedCategory, selectedCity, sortBy]);

  const sortedBusinesses = useMemo(() => {
    return [...filteredBusinesses].sort((a, b) => {
      const aFav = isFavorited({ businessId: a.id }) ? 0 : 1;
      const bFav = isFavorited({ businessId: b.id }) ? 0 : 1;
      return aFav - bFav;
    });
  }, [filteredBusinesses, isFavorited]);

  const activeFilterCount = [selectedCategory, selectedCity].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setSelectedCity(null);
    setSortBy('name');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t('explore.title')}</h1>
          <p className="text-gray-400">{t('explore.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
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
            {search && (
              <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <X size={16} className="text-gray-500 hover:text-white" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all whitespace-nowrap ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                : 'bg-dark-card border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline text-sm font-medium">{t('explore.filters')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Tags */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !selectedCategory ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          {t('explore.all')}
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expandable Filters Panel */}
      {showFilters && (
        <div className="bg-dark-card border border-white/10 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">{t('explore.filters')}</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-blue-400 hover:underline">
                {t('explore.clearFilters')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('explore.city')}</label>
              <select
                value={selectedCity || ''}
                onChange={(e) => setSelectedCity(e.target.value || null)}
                className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
              >
                <option value="">{t('explore.allCities')}</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('explore.sortBy')}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
                className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
              >
                <option value="name">{t('explore.sortByName')}</option>
                <option value="recent">{t('explore.sortByRecent')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {sortedBusinesses.length} {sortedBusinesses.length === 1 ? t('explore.result') : t('explore.results')}
        </p>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
            <X size={14} />
            {t('explore.clearFilters')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>
      ) : sortedBusinesses.length === 0 ? (
        <div className="bg-dark-card rounded-3xl p-12 border border-white/5 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg">{t('explore.noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBusinesses.map((business) => (
            <Link 
              key={business.id} 
              to={`/reservar/${business.slug}`}
              className={`group bg-dark-card border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full relative overflow-hidden ${isFavorited({ businessId: business.id }) ? 'ring-1 ring-yellow-500/30' : ''}`}
            >
              <div className="absolute top-0 right-0 p-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                <FavoriteButton
                  isFavorited={isFavorited({ businessId: business.id })}
                  onToggle={() => toggleFavorite({ businessId: business.id })}
                  size={18}
                />
                <ChevronRight className="text-blue-400" />
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-blue-400">{business.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{business.name}</h3>
                  {business.category && (
                    <span className="text-xs font-medium text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full">{business.category}</span>
                  )}
                </div>
              </div>

              {business.description && (
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{business.description}</p>
              )}
              
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