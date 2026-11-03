import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Compass,
  Utensils,
  Plane,
  Palette,
  Bookmark,
  Calendar,
  ExternalLink,
  MapPin,
  Filter,
  Navigation,
  Check
} from 'lucide-react';
import { Goal, Event, DateMood } from '../../types';
import { getCachedAI, setCachedAI } from '../../utils/aiCache';
import { formatRand } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MoodBadge } from '../ui/MoodBadge';
import { hapticSuccess, hapticLight } from '../../utils/haptics';
import { fetchDiscoverSuggestions, discoverDateIdeas, DiscoverItem } from '../../utils/aiClient';
import { 
  SA_PROVINCES, 
  getNearestProvince, 
  calculateDistanceKm, 
  ALL_PROVINCES_DATE_SPOTS,
  CuratedDateSpot 
} from '../../utils/provinces';
import { DATE_MOODS } from '../../utils/moods';

interface DiscoverViewProps {
  location: { lat: number; lng: number } | null;
  goals: Goal[];
  events: Event[];
  onPlanDate?: (info: { title: string; location: string; description?: string; mood?: DateMood }) => void;
  onAddToWishlist?: (item: { title: string; category: string; notes?: string }) => void;
}

export default function DiscoverView({
  location,
  goals,
  events,
  onPlanDate,
  onAddToWishlist,
}: DiscoverViewProps) {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Province selection: 'near-me' (default if GPS available), 'all', or province id ('wc', 'gp', 'kzn', etc.)
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(location ? 'near-me' : 'all');
  const [selectedMood, setSelectedMood] = useState<DateMood | 'all'>('all');

  // Detect nearest province when user location changes
  const nearestProvince = useMemo(() => {
    if (!location) return null;
    return getNearestProvince(location.lat, location.lng);
  }, [location]);

  // Determine active province name for API prompt context
  const activeProvinceName = useMemo(() => {
    if (selectedProvinceId === 'near-me' && nearestProvince) {
      return nearestProvince.name;
    }
    if (selectedProvinceId !== 'all' && selectedProvinceId !== 'near-me') {
      const match = SA_PROVINCES.find(p => p.id === selectedProvinceId);
      return match ? match.name : undefined;
    }
    return undefined;
  }, [selectedProvinceId, nearestProvince]);

  const fetchSuggestions = async () => {
    try {
      const goalsContext = goals.map(g => ({ name: g.name }));
      const data = await fetchDiscoverSuggestions(goalsContext);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Suggestions notice:", err);
    }
  };

  // Convert curated date spots into DiscoverItems matching current filters
  const getCuratedDateSpotsAsDiscoverItems = (): DiscoverItem[] => {
    let spots = [...ALL_PROVINCES_DATE_SPOTS];

    // Filter by province
    if (selectedProvinceId === 'near-me' && nearestProvince) {
      spots = spots.filter(s => s.provinceId === nearestProvince.id);
    } else if (selectedProvinceId !== 'all' && selectedProvinceId !== 'near-me') {
      spots = spots.filter(s => s.provinceId === selectedProvinceId);
    }

    // Filter by mood
    if (selectedMood !== 'all') {
      spots = spots.filter(s => s.mood === selectedMood);
    }

    // Proximity sorting if user location is available
    if (location) {
      spots.sort((a, b) => {
        const distA = calculateDistanceKm(location.lat, location.lng, a.location.lat, a.location.lng);
        const distB = calculateDistanceKm(location.lat, location.lng, b.location.lat, b.location.lng);
        return distA - distB;
      });
    }

    return spots.slice(0, 9).map(spot => {
      const prov = SA_PROVINCES.find(p => p.id === spot.provinceId);
      const dist = location ? calculateDistanceKm(location.lat, location.lng, spot.location.lat, spot.location.lng) : null;
      return {
        title: spot.name,
        summary: spot.summary,
        category: spot.category,
        estimatedBudget: spot.estimatedBudgetZar,
        imageSearchTerm: `${spot.name} ${prov?.name || 'South Africa'}`,
        sourceName: dist !== null ? `${dist} km away • ${prov?.name}` : (prov ? `${prov.name}` : 'Curated'),
        isAiGenerated: false,
      };
    });
  };

  const discoverIdeas = async (searchQuery?: string, provName?: string, moodName?: string) => {
    const finalQuery = searchQuery !== undefined ? searchQuery : queryStr;
    const finalProvince = provName !== undefined ? provName : activeProvinceName;
    const finalMood = moodName !== undefined ? moodName : (selectedMood === 'all' ? undefined : selectedMood);

    const cacheKey = `discover_v3_${finalQuery || 'default'}_${finalProvince || 'any'}_${finalMood || 'any'}_${location ? `${location.lat.toFixed(2)}_${location.lng.toFixed(2)}` : 'za'}`;
    const cached = getCachedAI<DiscoverItem[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setResults(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const finalData = await discoverDateIdeas({
        query: finalQuery,
        goals: goals.map(g => ({ name: g.name })),
        events: events.map(e => ({ title: e.title })),
        location: location,
        provinceName: finalProvince,
        mood: finalMood,
      });

      if (finalData && finalData.length > 0) {
        setResults(finalData);
        setCachedAI(cacheKey, finalData);
      } else {
        setResults(getCuratedDateSpotsAsDiscoverItems());
      }
    } catch (err: any) {
      console.warn("Discover ideas fallback to multi-province curated list:", err);
      setResults(getCuratedDateSpotsAsDiscoverItems());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    discoverIdeas();
    fetchSuggestions();
  }, [location, selectedProvinceId, selectedMood]);

  const quickFilters = [
    { label: 'Romantic Dinners', icon: <Utensils className="w-3.5 h-3.5" /> },
    { label: 'Weekend Getaways', icon: <Plane className="w-3.5 h-3.5" /> },
    { label: 'Outdoor Sunsets', icon: <Compass className="w-3.5 h-3.5" /> },
    { label: 'Creative Dates', icon: <Palette className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-3xl font-serif text-on-surface">Discover Romance</h1>
          {nearestProvince && location && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary w-fit">
              <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Nearest region: {nearestProvince.name}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-outline/80">
          Curated restaurants, scenic hideaways, and date activities across all South African provinces
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="Search dates, vineyards, stargazing, cozy dinners, beach picnics..."
            className="w-full bg-surface-container text-on-surface rounded-2xl py-3.5 pl-12 pr-28 outline-none focus:border-primary border border-outline-variant/20 text-sm shadow-xs placeholder:text-outline/50"
            value={queryStr}
            onChange={e => setQueryStr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && discoverIdeas()}
          />
          <Button
            variant="primary"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => discoverIdeas()}
          >
            Explore
          </Button>
        </div>

        {/* AI Quick Prompt Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-outline flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-secondary" /> AI Suggestions:
            </span>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQueryStr(s);
                  discoverIdeas(s);
                }}
                className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded-full transition-colors border border-primary/20 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* 1. South African Province Selector Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-outline">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Select Province / Region
            </span>
            {selectedProvinceId !== 'all' && (
              <button
                onClick={() => {
                  hapticLight();
                  setSelectedProvinceId('all');
                }}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                View All Provinces
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {/* Near Me Pill */}
            {location && (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSelectedProvinceId('near-me');
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedProvinceId === 'near-me'
                    ? 'bg-primary text-on-primary-fixed shadow-xs border border-primary'
                    : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-primary/40'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>📍 Near Me {nearestProvince ? `(${nearestProvince.shortName})` : ''}</span>
              </button>
            )}

            {/* All Provinces Pill */}
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setSelectedProvinceId('all');
              }}
              className={`flex items-center gap-1 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedProvinceId === 'all'
                  ? 'bg-primary text-on-primary-fixed shadow-xs border border-primary'
                  : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-primary/40'
              }`}
            >
              <span>🌍 All 9 Provinces</span>
            </button>

            {/* 9 Individual SA Provinces */}
            {SA_PROVINCES.map((prov) => {
              const isSelected = selectedProvinceId === prov.id;
              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSelectedProvinceId(prov.id);
                  }}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary-fixed shadow-xs border border-primary'
                      : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-primary/40'
                  }`}
                >
                  <span>{prov.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Mood & Vibe Filter Row */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-outline">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-secondary" /> Date Mood & Vibe
            </span>
            {selectedMood !== 'all' && (
              <button
                onClick={() => {
                  hapticLight();
                  setSelectedMood('all');
                }}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                Reset Vibe
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setSelectedMood('all');
              }}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedMood === 'all'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-secondary/40'
              }`}
            >
              All Moods
            </button>

            {DATE_MOODS.map((mood) => {
              const isSelected = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSelectedMood(mood.id);
                  }}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? `${mood.activeClass} font-bold shadow-xs`
                      : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-outline-variant/40'
                  }`}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Style Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {quickFilters.map((filter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQueryStr(filter.label);
                discoverIdeas(filter.label);
              }}
              className="flex items-center gap-1.5 whitespace-nowrap bg-surface-container-low px-3.5 py-1.5 rounded-full text-xs font-semibold text-on-surface border border-outline-variant/15 hover:border-primary/40 transition-colors cursor-pointer"
            >
              {filter.icon}
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-outline font-medium">
            Curating date ideas for {activeProvinceName || 'South Africa'}...
          </p>
        </div>
      )}

      {/* Grid of Results */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((idea, i) => (
            <DiscoverCard
              key={i}
              idea={idea}
              userLocation={location}
              onPlanDate={onPlanDate}
              onAddToWishlist={onAddToWishlist}
            />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16 border border-dashed border-outline-variant/20 rounded-3xl">
          <p className="text-sm text-outline">
            No ideas found in {activeProvinceName || 'this region'}. Try broadening your search or switching provinces.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setSelectedProvinceId('all');
              setSelectedMood('all');
              setQueryStr('');
              discoverIdeas('', undefined, undefined);
            }}
          >
            Explore All South Africa
          </Button>
        </div>
      )}
    </div>
  );
}

interface DiscoverCardProps {
  idea: DiscoverItem;
  userLocation?: { lat: number; lng: number } | null;
  onPlanDate?: (info: { title: string; location: string; description?: string; mood?: DateMood }) => void;
  onAddToWishlist?: (item: { title: string; category: string; notes?: string }) => void;
}

const DiscoverCard: React.FC<DiscoverCardProps> = ({
  idea,
  userLocation,
  onPlanDate,
  onAddToWishlist,
}) => {
  const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(idea.imageSearchTerm || idea.title)}/800/450`;

  // Infer mood from title or category if not explicitly given
  const inferredMood: DateMood = useMemo(() => {
    const text = `${idea.title} ${idea.category} ${idea.summary}`.toLowerCase();
    if (text.includes('romantic') || text.includes('candle') || text.includes('wine')) return 'Romantic';
    if (text.includes('adventure') || text.includes('hike') || text.includes('canopy') || text.includes('bridge')) return 'Adventurous';
    if (text.includes('cozy') || text.includes('fire') || text.includes('fireplace') || text.includes('picnic')) return 'Cozy';
    if (text.includes('fun') || text.includes('pottery') || text.includes('play')) return 'Playful';
    if (text.includes('luxury') || text.includes('champagne') || text.includes('rooftop')) return 'Luxurious';
    return 'Relaxed';
  }, [idea]);

  return (
    <Card variant="high" padding="none" className="overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
      {/* Image Banner with Badges */}
      <div className="h-48 w-full relative bg-surface-container-highest overflow-hidden">
        <img
          src={fallbackUrl}
          alt={idea.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high/90 via-transparent to-black/30" />

        {/* Badges for Honest AI & Location Proximity */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {idea.isAiGenerated ? (
            <span className="bg-background/85 backdrop-blur-md text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3 h-3" /> AI Curated
            </span>
          ) : (
            <span className="bg-background/85 backdrop-blur-md text-[10px] font-bold text-secondary px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-2xs">
              <MapPin className="w-3 h-3" /> SA Destination
            </span>
          )}
          <span className="bg-background/85 backdrop-blur-md text-[10px] font-medium text-outline px-2 py-0.5 rounded-full border border-white/10">
            Illustration
          </span>
        </div>

        {/* Mood Badge Pill Overlay */}
        <div className="absolute top-3 right-3">
          <MoodBadge mood={inferredMood} size="sm" />
        </div>

        {idea.category && (
          <div className="absolute bottom-2 left-3 bg-background/85 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-secondary">
            {idea.category}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-xl font-bold text-on-surface leading-snug">
              {idea.title}
            </h3>
          </div>
          <p className="text-xs text-on-surface/85 leading-relaxed line-clamp-3">
            {idea.summary}
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-outline-variant/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-outline">
              {idea.estimatedBudget ? 'Estimated cost:' : 'Cost varies'}
            </span>
            {idea.estimatedBudget && (
              <span className="font-serif font-bold text-primary text-sm">
                ~{formatRand(idea.estimatedBudget)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[11px] text-outline truncate max-w-[170px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-secondary shrink-0" />
              {idea.sourceName || 'South Africa'}
            </span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${idea.title} South Africa`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              Search info <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {onAddToWishlist && (
              <Button
                variant="outline"
                size="sm"
                icon={<Bookmark className="w-3.5 h-3.5 text-secondary" />}
                onClick={() => {
                  onAddToWishlist({
                    title: idea.title,
                    category: idea.category || 'Romantic Dinners',
                    notes: `${idea.summary} (${idea.sourceName || 'South Africa'})`
                  });
                  hapticSuccess();
                }}
              >
                Wishlist
              </Button>
            )}
            {onPlanDate && (
              <Button
                variant="primary"
                size="sm"
                icon={<Calendar className="w-3.5 h-3.5" />}
                onClick={() => {
                  onPlanDate({
                    title: idea.title,
                    location: idea.title,
                    description: idea.summary,
                    mood: inferredMood,
                  });
                  hapticSuccess();
                }}
              >
                Plan Date
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
