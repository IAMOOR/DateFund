import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Tag
} from 'lucide-react';
import { Goal, Event } from '../../types';
import { getCachedAI, setCachedAI } from '../../utils/aiCache';
import { formatRand } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { hapticSuccess, hapticLight } from '../../utils/haptics';
import { fetchDiscoverSuggestions, discoverDateIdeas, DiscoverItem } from '../../utils/aiClient';

interface DiscoverViewProps {
  location: { lat: number; lng: number } | null;
  goals: Goal[];
  events: Event[];
  onPlanDate?: (info: { title: string; location: string; description?: string }) => void;
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

  const fetchSuggestions = async () => {
    try {
      const goalsContext = goals.map(g => ({ name: g.name }));
      const data = await fetchDiscoverSuggestions(goalsContext);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Suggestions notice:", err);
    }
  };

  const discoverIdeas = async (searchQuery?: string) => {
    const finalQuery = searchQuery || queryStr;
    const cacheKey = `discover_v2_${finalQuery || 'default'}_${location ? `${location.lat.toFixed(2)}_${location.lng.toFixed(2)}` : 'za'}`;
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
      });

      setResults(finalData);
      if (finalData.length > 0) {
        setCachedAI(cacheKey, finalData);
      }
    } catch (err: any) {
      console.warn("Discover ideas error:", err);
      // Fallback high quality ideas if network/server issue occurs
      const fallbackData: DiscoverItem[] = [
        {
          title: "Franschhoek Wine Tram & Cellar Dinner",
          summary: "Hop on the open-air wooden tram through rolling valley vineyards followed by a candlelit four-course pairing.",
          category: "Travel",
          estimatedBudget: 1600,
          imageSearchTerm: "vineyard tram sunset wine",
          sourceName: "Franschhoek Tourism",
          isAiGenerated: true,
        },
        {
          title: "Lion's Head Full Moon Sunset Picnic",
          summary: "Pack artisanal cheeses, a cozy blanket, and watch golden hour sink into the Atlantic while city lights ignite.",
          category: "Cozy & Scenic",
          estimatedBudget: 350,
          imageSearchTerm: "sunset mountain picnic cape town",
          sourceName: "Local Couple Favorite",
          isAiGenerated: true,
        },
        {
          title: "Clay Pottery & Red Wine Workshop",
          summary: "Learn to throw earthenware bowls on the potter's wheel together while enjoying rich South African Pinotage.",
          category: "Creative",
          estimatedBudget: 850,
          imageSearchTerm: "pottery couple hands clay wine",
          sourceName: "Studio Workshop",
          isAiGenerated: true,
        }
      ];
      setResults(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    discoverIdeas();
    fetchSuggestions();
  }, [location]);

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
        <h1 className="text-3xl font-serif text-on-surface">Discover Romance</h1>
        <p className="text-xs text-outline/80">
          Inspiration for your next couple getaway, dinner date, or weekend outing
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="Search dates, vineyards, stargazing, cozy dinners..."
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
            <span className="text-[10px] uppercase tracking-wider font-semibold text-outline">
              AI Suggestions:
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

        {/* Quick Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickFilters.map((filter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQueryStr(filter.label);
                discoverIdeas(filter.label);
              }}
              className="flex items-center gap-1.5 whitespace-nowrap bg-surface-container-high px-3.5 py-1.5 rounded-full text-xs font-semibold text-on-surface border border-outline-variant/15 hover:border-primary/40 transition-colors"
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
          <p className="text-xs text-outline font-medium">Curating romantic recommendations...</p>
        </div>
      )}

      {/* Grid of Results */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((idea, i) => (
            <DiscoverCard
              key={i}
              idea={idea}
              onPlanDate={onPlanDate}
              onAddToWishlist={onAddToWishlist}
            />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16 border border-dashed border-outline-variant/20 rounded-3xl">
          <p className="text-sm text-outline">No ideas found. Try searching for "Fine Dining" or "Weekend Getaways".</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => discoverIdeas('Romantic Getaways')}>
            Explore Ideas
          </Button>
        </div>
      )}
    </div>
  );
}

interface DiscoverCardProps {
  idea: DiscoverItem;
  onPlanDate?: (info: { title: string; location: string; description?: string }) => void;
  onAddToWishlist?: (item: { title: string; category: string; notes?: string }) => void;
}

const DiscoverCard: React.FC<DiscoverCardProps> = ({
  idea,
  onPlanDate,
  onAddToWishlist,
}) => {
  const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(idea.imageSearchTerm || idea.title)}/800/450`;

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

        {/* Badges for Honest AI & Illustration Transparency */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="bg-background/80 backdrop-blur-md text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Suggestion
          </span>
          <span className="bg-background/80 backdrop-blur-md text-[10px] font-medium text-outline px-2 py-0.5 rounded-full border border-white/10">
            Illustration
          </span>
        </div>

        {idea.category && (
          <div className="absolute bottom-2 left-3 bg-background/80 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-secondary">
            {idea.category}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-bold text-on-surface leading-snug">
            {idea.title}
          </h3>
          <p className="text-xs text-on-surface/85 leading-relaxed">
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
            <span className="text-[11px] text-outline truncate max-w-[140px]">
              Idea style: {idea.sourceName || 'Curated'}
            </span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${idea.title} South Africa`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              Search the web <ExternalLink className="w-3 h-3" />
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
                    notes: idea.summary
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
                    description: idea.summary
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
}
