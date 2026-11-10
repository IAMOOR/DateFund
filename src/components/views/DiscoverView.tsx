import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  Search,
  Sparkles,
  Compass,
  Utensils,
  Palette,
  Bookmark,
  Calendar,
  ExternalLink,
  MapPin,
  Navigation,
  Star,
  Coffee,
  TreePine,
  Wine,
  Heart,
  PiggyBank,
  Loader2,
  CloudSun,
  Sunset,
  Wind,
  MessageSquareQuote,
  Eye,
  Map as MapIcon,
  X,
  Footprints,
  RefreshCw,
  MessageCircleHeart
} from 'lucide-react';
import { Goal, Event, DateMood, SharedSpotPayload } from '../../types';
import { formatRand } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { BottomSheet } from '../ui/BottomSheet';
import { hapticSuccess, hapticLight, hapticMedium } from '../../utils/haptics';
import {
  fetchDiscoverSuggestions,
  discoverDateIdeas,
  fetchSpotWeather,
  DiscoverItem,
  DiscoverReviewSnippet,
  SpotWeatherConditions
} from '../../utils/aiClient';
import {
  SA_PROVINCES,
  EKURHULENI_SUBREGIONS,
  getNearestProvince,
  calculateDistanceKm,
  ALL_PROVINCES_DATE_SPOTS
} from '../../utils/provinces';
import { DATE_MOODS } from '../../utils/moods';

export interface DiscoverViewProps {
  location: { lat: number; lng: number } | null;
  goals: Goal[];
  events: Event[];
  onPlanDate?: (info: { title: string; location: string; description?: string; mood?: DateMood }) => void;
  onAddToWishlist?: (item: { title: string; category: string; notes?: string; estimatedBudget?: number }) => void;
  onFundDateGoal?: (goalInfo: { name: string; targetAmount: number; deadline?: string }) => void;
  onShareSpotToChat?: (spot: SharedSpotPayload) => void;
  onOpenMap?: () => void;
}

export type EkurhuleniCategory = 'All' | 'Cozy' | 'Active' | 'Romantic';
export type EkurhuleniTownId = 'all-ekurhuleni' | 'benoni' | 'boksburg' | 'brakpan' | 'springs';

interface EkurhuleniCategorySpec {
  id: Exclude<EkurhuleniCategory, 'All'>;
  label: string;
  description: string;
  icon: React.ReactNode;
  placesQuery: string;
  moodMapping: DateMood;
}

const EKURHULENI_CATEGORIES: EkurhuleniCategorySpec[] = [
  {
    id: 'Cozy',
    label: 'Cozy',
    description: 'Garden cafés, tea gardens, fireplace bistros, bakeries & craft markets',
    icon: <Coffee className="w-3.5 h-3.5" />,
    placesQuery: 'cozy cafe coffee roastery tea garden bakery fireplace bistro',
    moodMapping: 'Cozy'
  },
  {
    id: 'Active',
    label: 'Active',
    description: 'Lakeside walks, kayaking, bird sanctuaries, bowling, pottery & outdoor fun',
    icon: <Footprints className="w-3.5 h-3.5" />,
    placesQuery: 'outdoor activity nature reserve dam walk ten pin bowling adventure park',
    moodMapping: 'Adventurous'
  },
  {
    id: 'Romantic',
    label: 'Romantic',
    description: 'Candlelit dining, waterfront terraces, steakhouses, spas & sunset lounges',
    icon: <Heart className="w-3.5 h-3.5" />,
    placesQuery: 'romantic fine dining restaurant steakhouse wine bar couples spa sunset terrace',
    moodMapping: 'Romantic'
  }
];

const EKURHULENI_TOWNS: Array<{
  id: EkurhuleniTownId;
  name: string;
  shortDesc: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
}> = [
  {
    id: 'all-ekurhuleni',
    name: 'All 4 Towns',
    shortDesc: 'Benoni · Boksburg · Brakpan · Springs',
    center: { lat: -26.2150, lng: 28.3480 },
    radiusMeters: 22000
  },
  {
    id: 'benoni',
    name: 'Benoni',
    shortDesc: 'Farrarmere, Rynfield, Homestead Dam & Korsman Sanctuary',
    center: { lat: -26.1885, lng: 28.3208 },
    radiusMeters: 9500
  },
  {
    id: 'boksburg',
    name: 'Boksburg',
    shortDesc: 'Bartlett, Bokkie Park, Sunward Park & ERPM',
    center: { lat: -26.2125, lng: 28.2526 },
    radiusMeters: 9500
  },
  {
    id: 'brakpan',
    name: 'Brakpan',
    shortDesc: 'Carnival City, Dalpark Sanctuary & Mall@Carnival',
    center: { lat: -26.2366, lng: 28.3694 },
    radiusMeters: 9500
  },
  {
    id: 'springs',
    name: 'Springs',
    shortDesc: 'Petersfield, Selection Park, Pollak Park & Marievale',
    center: { lat: -26.2547, lng: 28.4428 },
    radiusMeters: 11000
  }
];

type ExperienceCategoryId =
  | 'all'
  | 'cozy-cafes'
  | 'romantic-dining'
  | 'lakeside-picnics'
  | 'fun-activities'
  | 'spas-sunsets';

interface ExperienceCategoryOption {
  id: ExperienceCategoryId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  placesQuery: string;
  keywords: RegExp;
}

const EXPERIENCE_CATEGORIES: ExperienceCategoryOption[] = [
  {
    id: 'all',
    label: 'All Date Experiences',
    shortLabel: 'All Ideas',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    placesQuery: 'romantic date restaurants cozy cafes parks activities',
    keywords: /.*/i
  },
  {
    id: 'cozy-cafes',
    label: 'Cozy Cafés, Fireplaces & Tea Gardens',
    shortLabel: 'Cozy Cafés & Tea Gardens',
    icon: <Coffee className="w-3.5 h-3.5" />,
    placesQuery: 'cozy cafe coffee roastery tea garden bakery fireplace bistro',
    keywords: /cozy|café|cafe|coffee|tea garden|bakery|fireplace|bistro|waffle|pastry|roastery|market/i
  },
  {
    id: 'romantic-dining',
    label: 'Romantic Restaurants & Fine Dining',
    shortLabel: 'Restaurants & Dining',
    icon: <Utensils className="w-3.5 h-3.5" />,
    placesQuery: 'romantic dinner restaurant steakhouse seafood wine bar',
    keywords: /dining|restaurant|steakhouse|seafood|grill|wine|tapas|candle|bistro|terrace/i
  },
  {
    id: 'lakeside-picnics',
    label: 'Lakeside Walks, Bird Sanctuaries & Picnics',
    shortLabel: 'Lakeside & Picnics',
    icon: <TreePine className="w-3.5 h-3.5" />,
    placesQuery: 'scenic lake dam picnic park bird sanctuary botanical garden nature walk',
    keywords: /dam|lake|lakeside|picnic|sanctuary|bird|wetland|botanical|garden|walk|park|nature|trail/i
  },
  {
    id: 'fun-activities',
    label: 'Fun Activities, Bowling & Creative Dates',
    shortLabel: 'Activities & Fun Dates',
    icon: <Palette className="w-3.5 h-3.5" />,
    placesQuery: 'ten pin bowling pottery painting couples activity entertainment market',
    keywords: /bowling|arcade|carnival|pottery|bunny|playful|adventure|kayak|canopy|tram|gondola|balloon|lift/i
  },
  {
    id: 'spas-sunsets',
    label: 'Couples Spas, Country Clubs & Sunsets',
    shortLabel: 'Spas & Sunsets',
    icon: <Wine className="w-3.5 h-3.5" />,
    placesQuery: 'couples day spa country club sunset terrace rooftop lounge',
    keywords: /spa|sunset|sundowner|country club|rooftop|estate|fairway|viewpoint|stargazing|retreat/i
  }
];

// Cache for Google Maps Places enrichment so we never duplicate API calls for the same venue
const discoverPlacesCache: Record<string, Partial<DiscoverItem>> = {};
const discoverSearchCache: Record<string, DiscoverItem[]> = {};
const ekurhuleniPlacesCache: Record<string, DiscoverItem[]> = {};

function estimateRandFromPriceLevel(priceLevel?: string, defaultBudget: number = 480): number {
  const p = String(priceLevel || '').toUpperCase();
  if (p.includes('VERY_EXPENSIVE') || p === '$$$$' || p === 'RRRR') return 1350;
  if (p.includes('EXPENSIVE') || p === '$$$' || p === 'RRR') return 850;
  if (p.includes('MODERATE') || p === '$$' || p === 'RR') return 480;
  if (p.includes('INEXPENSIVE') || p === '$' || p === 'R') return 260;
  return defaultBudget;
}

function normalizePriceBadge(priceLevel?: string, budget?: number): string {
  const p = String(priceLevel || '').toUpperCase();
  if (p.includes('VERY_EXPENSIVE') || p === '$$$$' || p === 'RRRR') return 'RRRR';
  if (p.includes('EXPENSIVE') || p === '$$$' || p === 'RRR') return 'RRR';
  if (p.includes('MODERATE') || p === '$$' || p === 'RR') return 'RR';
  if (p.includes('INEXPENSIVE') || p === '$' || p === 'R') return 'R';
  if (budget && budget >= 1100) return 'RRRR';
  if (budget && budget >= 750) return 'RRR';
  if (budget && budget >= 380) return 'RR';
  return 'R';
}

export function classifyEkurhuleniCategory(item: {
  title?: string;
  name?: string;
  category?: string;
  summary?: string;
  mood?: string;
}): Exclude<EkurhuleniCategory, 'All'> {
  const text = `${item.title || item.name || ''} ${item.category || ''} ${item.summary || ''} ${item.mood || ''}`.toLowerCase();

  if (
    item.mood === 'Adventurous' ||
    item.mood === 'Playful' ||
    /active|bowling|arcade|carnival|kayak|paddle|walk|trail|sanctuary|bird|pottery|bunny|park|dam|golf|adventure|sport|wetland/i.test(
      text
    )
  ) {
    // Keep tea gardens and cozy cafés in Cozy unless predominantly active
    if (!/tea garden|secret garden café|bakery|fireplace bistro/i.test(text)) {
      return 'Active';
    }
  }

  if (
    item.mood === 'Romantic' ||
    item.mood === 'Luxurious' ||
    /romantic|fine dining|steakhouse|waterfront dining|sundowner|sunset|wine|spa|candle|seafood|jazz/i.test(text)
  ) {
    return 'Romantic';
  }

  return 'Cozy';
}

function detectEkurhuleniTownLabel(item: DiscoverItem): string {
  const sub = (item.subRegionId || '').toLowerCase();
  if (sub === 'benoni') return 'Benoni';
  if (sub === 'boksburg') return 'Boksburg';
  if (sub === 'brakpan') return 'Brakpan';
  if (sub === 'springs') return 'Springs';
  const addr = `${item.title} ${item.address || ''} ${item.sourceName || ''}`.toLowerCase();
  if (addr.includes('benoni') || addr.includes('rynfield') || addr.includes('farrarmere') || addr.includes('westdene')) return 'Benoni';
  if (addr.includes('boksburg') || addr.includes('bartlett') || addr.includes('sunward') || addr.includes('parkdene')) return 'Boksburg';
  if (addr.includes('brakpan') || addr.includes('carnival city') || addr.includes('dalpark')) return 'Brakpan';
  if (addr.includes('springs') || addr.includes('petersfield') || addr.includes('marievale') || addr.includes('pollak')) return 'Springs';
  return 'Ekurhuleni';
}

function inferMoodFromItem(idea: DiscoverItem): DateMood {
  if (idea.mood && ['Romantic', 'Adventurous', 'Cozy', 'Playful', 'Luxurious', 'Relaxed'].includes(idea.mood)) {
    return idea.mood as DateMood;
  }
  const text = `${idea.title} ${idea.category} ${idea.summary}`.toLowerCase();
  if (text.includes('cozy') || text.includes('café') || text.includes('cafe') || text.includes('fireplace') || text.includes('tea') || text.includes('bakery')) {
    return 'Cozy';
  }
  if (text.includes('bowling') || text.includes('carnival') || text.includes('arcade') || text.includes('pottery') || text.includes('bunny') || text.includes('fun')) {
    return 'Playful';
  }
  if (text.includes('adventure') || text.includes('hike') || text.includes('kayak') || text.includes('canopy') || text.includes('bridge') || text.includes('active')) {
    return 'Adventurous';
  }
  if (text.includes('luxury') || text.includes('fine dining') || text.includes('champagne') || text.includes('spa')) {
    return 'Luxurious';
  }
  if (text.includes('sanctuary') || text.includes('dam') || text.includes('lake') || text.includes('picnic') || text.includes('walk')) {
    return 'Relaxed';
  }
  return 'Romantic';
}

function DiscoverContent({
  location,
  goals,
  events,
  onPlanDate,
  onAddToWishlist,
  onFundDateGoal,
  onShareSpotToChat,
  onOpenMap
}: DiscoverViewProps) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Dedicated "Ekurhuleni Discover" Section State (Benoni, Boksburg, Brakpan, Springs + Cozy / Active / Romantic)
  const [ekurhuleniTown, setEkurhuleniTown] = useState<EkurhuleniTownId>('all-ekurhuleni');
  const [ekurhuleniCategory, setEkurhuleniCategory] = useState<EkurhuleniCategory>('All');
  const [ekurhuleniPlaces, setEkurhuleniPlaces] = useState<DiscoverItem[]>([]);
  const [isLoadingEkurhuleniPlaces, setIsLoadingEkurhuleniPlaces] = useState(false);

  // National / Multi-Province Discover State
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchingGooglePlaces, setIsSearchingGooglePlaces] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Live Google Maps Places Autocomplete predictions in the search bar
  const [placePredictions, setPlacePredictions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('ekurhuleni');
  const [selectedEkurhuleniSubRegion, setSelectedEkurhuleniSubRegion] = useState<string>('all-ekurhuleni');
  const [selectedExperienceCat, setSelectedExperienceCat] = useState<ExperienceCategoryId>('all');
  const [selectedMood, setSelectedMood] = useState<DateMood | 'all'>('all');

  // Selected Venue for BottomSheet Inspector (Photos, Reviews, Live Weather & Sunset)
  const [inspectedItem, setInspectedItem] = useState<DiscoverItem | null>(null);
  const [inspectedWeather, setInspectedWeather] = useState<SpotWeatherConditions | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  useEffect(() => {
    if (placesLib && !sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  // Build baseline Ekurhuleni spots for Benoni, Boksburg, Brakpan, and Springs
  const getCuratedEkurhuleniSpots = useCallback(
    (townId: EkurhuleniTownId, categoryFilter: EkurhuleniCategory): DiscoverItem[] => {
      const coreFourTowns = new Set(['benoni', 'boksburg', 'brakpan', 'springs']);
      let spots = ALL_PROVINCES_DATE_SPOTS.filter(
        s => s.provinceId === 'ekurhuleni' && (!s.subRegionId || coreFourTowns.has(s.subRegionId))
      );

      if (townId !== 'all-ekurhuleni') {
        spots = spots.filter(s => s.subRegionId === townId);
      }

      if (location) {
        spots.sort((a, b) => {
          const dA = calculateDistanceKm(location.lat, location.lng, a.location.lat, a.location.lng);
          const dB = calculateDistanceKm(location.lat, location.lng, b.location.lat, b.location.lng);
          return dA - dB;
        });
      }

      const mapped: DiscoverItem[] = spots.map(spot => {
        const ekCat = classifyEkurhuleniCategory(spot);
        const dist = location
          ? calculateDistanceKm(location.lat, location.lng, spot.location.lat, spot.location.lng)
          : null;
        const cached = discoverPlacesCache[spot.id] || {};

        return {
          id: spot.id,
          title: spot.name,
          summary: spot.summary,
          category: `${ekCat} · ${spot.category}`,
          estimatedBudget: spot.estimatedBudgetZar,
          address: spot.address,
          location: spot.location,
          rating: spot.rating,
          userRatingCount: spot.userRatingCount,
          priceLevel: normalizePriceBadge(spot.priceLevel, spot.estimatedBudgetZar),
          subRegionId: spot.subRegionId,
          mood: spot.mood,
          sourceName:
            dist !== null
              ? `${dist} km away · ${spot.address.split(',').slice(-2).join(',').trim()}`
              : spot.address,
          isAiGenerated: false,
          isGoogleMapsPlace: Boolean(cached.placeId),
          ...cached
        };
      });

      if (categoryFilter === 'All') {
        return mapped;
      }
      return mapped.filter(item => classifyEkurhuleniCategory(item) === categoryFilter);
    },
    [location]
  );

  // Fetch live Google Places API date spots for Benoni, Boksburg, Brakpan, and Springs in the 'Ekurhuleni Discover' section
  const fetchEkurhuleniGooglePlaces = useCallback(
    async (townId: EkurhuleniTownId, categoryFilter: EkurhuleniCategory, forceRefresh: boolean = false) => {
      // Always seed with curated Ekurhuleni spots immediately
      const curated = getCuratedEkurhuleniSpots(townId, categoryFilter);
      setEkurhuleniPlaces(curated);

      if (!placesLib) return;

      const townSpec = EKURHULENI_TOWNS.find(t => t.id === townId) || EKURHULENI_TOWNS[0];
      const catSpecsToQuery =
        categoryFilter === 'All'
          ? EKURHULENI_CATEGORIES
          : EKURHULENI_CATEGORIES.filter(c => c.id === categoryFilter);

      const cacheKey = `ek_discover_${townId}_${categoryFilter}`;
      if (!forceRefresh && ekurhuleniPlacesCache[cacheKey]) {
        const cachedList = ekurhuleniPlacesCache[cacheKey];
        setEkurhuleniPlaces(prev => {
          const seen = new Set<string>();
          const combined: DiscoverItem[] = [];
          for (const item of [...cachedList, ...prev]) {
            const k = item.title.toLowerCase().trim();
            if (!seen.has(k)) {
              seen.add(k);
              combined.push(item);
            }
          }
          return combined;
        });
        return;
      }

      setIsLoadingEkurhuleniPlaces(true);
      try {
        const liveFetched: DiscoverItem[] = [];
        const townQueryLabel =
          townId === 'all-ekurhuleni'
            ? 'Benoni Boksburg Brakpan Springs Ekurhuleni'
            : `${townSpec.name} Ekurhuleni`;

        for (const catSpec of catSpecsToQuery) {
          const textQuery = `${catSpec.placesQuery} in ${townQueryLabel} South Africa`;
          const { places } = await placesLib.Place.searchByText({
            textQuery,
            fields: [
              'id',
              'displayName',
              'formattedAddress',
              'location',
              'rating',
              'userRatingCount',
              'priceLevel',
              'photos',
              'reviews',
              'editorialSummary',
              'websiteURI',
              'googleMapsURI'
            ],
            locationBias: {
              center: townSpec.center,
              radius: townSpec.radiusMeters
            },
            maxResultCount: categoryFilter === 'All' ? 4 : 8
          });

          if (places && places.length > 0) {
            for (let idx = 0; idx < places.length; idx++) {
              const p: any = places[idx];
              const loc = p.location
                ? { lat: p.location.lat(), lng: p.location.lng() }
                : townSpec.center;
              const dist = location
                ? calculateDistanceKm(location.lat, location.lng, loc.lat, loc.lng)
                : null;
              const photoUris: string[] = Array.isArray(p.photos)
                ? p.photos.slice(0, 4).map((ph: any) => ph.getURI({ maxWidth: 800, maxHeight: 500 }))
                : [];
              const reviewSnippets: DiscoverReviewSnippet[] = Array.isArray(p.reviews)
                ? p.reviews.slice(0, 3).map((rv: any) => ({
                    authorName: rv.authorAttribution?.displayName || 'Google Maps Guest',
                    rating: rv.rating || 5,
                    text: rv.text || '',
                    relativeTime: rv.relativePublishTimeDescription || ''
                  }))
                : [];
              const estBudget = estimateRandFromPriceLevel(p.priceLevel as string, 480);
              const firstReview = reviewSnippets[0]?.text
                ? `"${reviewSnippets[0].text.slice(0, 140)}${reviewSnippets[0].text.length > 140 ? '...' : ''}"`
                : '';

              const inferredSubRegion =
                townId !== 'all-ekurhuleni'
                  ? townId
                  : detectEkurhuleniTownLabel({
                      title: p.displayName || '',
                      summary: '',
                      category: '',
                      estimatedBudget: estBudget,
                      address: p.formattedAddress || ''
                    }).toLowerCase();

              liveFetched.push({
                id: p.id || `ek-gmp-${catSpec.id}-${idx}-${Date.now()}`,
                placeId: p.id,
                title: p.displayName || `${townSpec.name} ${catSpec.label} Spot`,
                summary:
                  p.editorialSummary ||
                  firstReview ||
                  `Popular ${catSpec.label.toLowerCase()} date destination in ${p.formattedAddress || townSpec.name}.`,
                category: `${catSpec.id} · Google Places`,
                estimatedBudget: estBudget,
                address: p.formattedAddress || `${townSpec.name}, Ekurhuleni`,
                location: loc,
                rating: p.rating ?? 4.6,
                userRatingCount: p.userRatingCount ?? 90,
                priceLevel: normalizePriceBadge(p.priceLevel as string, estBudget),
                photoUrl: photoUris[0],
                photos: photoUris,
                reviews: reviewSnippets,
                googleMapsURI: p.googleMapsURI || undefined,
                websiteURI: p.websiteURI || undefined,
                subRegionId: inferredSubRegion,
                mood: catSpec.moodMapping,
                sourceName:
                  dist !== null
                    ? `${dist} km away · ${p.formattedAddress || townSpec.name}`
                    : p.formattedAddress || `${townSpec.name}, Ekurhuleni`,
                isAiGenerated: false,
                isGoogleMapsPlace: true
              });
            }
          }
        }

        if (liveFetched.length > 0) {
          ekurhuleniPlacesCache[cacheKey] = liveFetched;
          setEkurhuleniPlaces(prev => {
            const seen = new Set<string>();
            const combined: DiscoverItem[] = [];
            for (const item of [...liveFetched, ...prev]) {
              const k = item.title.toLowerCase().trim();
              if (!seen.has(k)) {
                seen.add(k);
                combined.push(item);
              }
            }
            return combined.slice(0, 18);
          });
        }
      } catch (err: any) {
        if (
          String(err?.message || err).includes('429') ||
          String(err?.message || err).includes('RESOURCE_EXHAUSTED')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      } finally {
        setIsLoadingEkurhuleniPlaces(false);
      }
    },
    [placesLib, getCuratedEkurhuleniSpots, location]
  );

  // Trigger Ekurhuleni Discover fetch when town, category, or placesLib changes
  useEffect(() => {
    fetchEkurhuleniGooglePlaces(ekurhuleniTown, ekurhuleniCategory);
  }, [ekurhuleniTown, ekurhuleniCategory, fetchEkurhuleniGooglePlaces]);

  // Also enrich curated Ekurhuleni Discover cards with real Google Places photos in the background
  useEffect(() => {
    if (!placesLib || ekurhuleniPlaces.length === 0) return;
    let isCancelled = false;

    const toEnrich = ekurhuleniPlaces
      .filter(item => item.id && !item.photoUrl && !discoverPlacesCache[item.id])
      .slice(0, 4);

    if (toEnrich.length === 0) return;

    const runEnrich = async () => {
      for (const spot of toEnrich) {
        if (isCancelled || !spot.id) break;
        try {
          const { places } = await placesLib.Place.searchByText({
            textQuery: `${spot.title} ${spot.address || 'Ekurhuleni South Africa'}`,
            fields: [
              'id',
              'displayName',
              'formattedAddress',
              'rating',
              'userRatingCount',
              'priceLevel',
              'photos',
              'reviews',
              'googleMapsURI',
              'websiteURI'
            ],
            ...(spot.location && {
              locationBias: { center: spot.location, radius: 10000 }
            }),
            maxResultCount: 1
          });

          if (!isCancelled && places && places.length > 0) {
            const p: any = places[0];
            const photoUris: string[] = Array.isArray(p.photos)
              ? p.photos.slice(0, 4).map((ph: any) => ph.getURI({ maxWidth: 800, maxHeight: 500 }))
              : [];
            const reviewSnippets: DiscoverReviewSnippet[] = Array.isArray(p.reviews)
              ? p.reviews.slice(0, 3).map((rv: any) => ({
                  authorName: rv.authorAttribution?.displayName || 'Verified Guest',
                  rating: rv.rating || 5,
                  text: rv.text || '',
                  relativeTime: rv.relativePublishTimeDescription || ''
                }))
              : [];

            const enriched: Partial<DiscoverItem> = {
              placeId: p.id,
              rating: p.rating ?? spot.rating,
              userRatingCount: p.userRatingCount ?? spot.userRatingCount,
              photoUrl: photoUris[0],
              photos: photoUris.length > 0 ? photoUris : undefined,
              reviews: reviewSnippets.length > 0 ? reviewSnippets : undefined,
              googleMapsURI: p.googleMapsURI || undefined,
              websiteURI: p.websiteURI || undefined,
              isGoogleMapsPlace: true
            };

            discoverPlacesCache[spot.id] = enriched;
            setEkurhuleniPlaces(prev =>
              prev.map(existing => (existing.id === spot.id ? { ...existing, ...enriched } : existing))
            );
          } else if (spot.id) {
            discoverPlacesCache[spot.id] = { isGoogleMapsPlace: false };
          }
        } catch (err: any) {
          if (
            String(err?.message || err).includes('429') ||
            String(err?.message || err).includes('RESOURCE_EXHAUSTED')
          ) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
            break;
          }
        }
      }
    };

    runEnrich();
    return () => {
      isCancelled = true;
    };
  }, [placesLib, ekurhuleniPlaces.length, ekurhuleniTown, ekurhuleniCategory]);

  // Compute category counts for the Ekurhuleni Discover section
  const ekurhuleniCategoryCounts = useMemo(() => {
    const allForTown = getCuratedEkurhuleniSpots(ekurhuleniTown, 'All');
    // Merge with any live places currently loaded for this town
    const seen = new Set<string>();
    const combined: DiscoverItem[] = [];
    for (const item of [...ekurhuleniPlaces, ...allForTown]) {
      const k = item.title.toLowerCase().trim();
      if (!seen.has(k)) {
        seen.add(k);
        combined.push(item);
      }
    }
    return {
      All: combined.length,
      Cozy: combined.filter(i => classifyEkurhuleniCategory(i) === 'Cozy').length,
      Active: combined.filter(i => classifyEkurhuleniCategory(i) === 'Active').length,
      Romantic: combined.filter(i => classifyEkurhuleniCategory(i) === 'Romantic').length
    };
  }, [getCuratedEkurhuleniSpots, ekurhuleniTown, ekurhuleniPlaces]);

  // Detect nearest province when user location changes
  const nearestProvince = useMemo(() => {
    if (!location) return null;
    return getNearestProvince(location.lat, location.lng);
  }, [location]);

  // Determine active region label & search center coordinates for the general Explorer below
  const activeRegionContext = useMemo(() => {
    if (selectedProvinceId === 'ekurhuleni') {
      const sub = EKURHULENI_SUBREGIONS.find(s => s.id === selectedEkurhuleniSubRegion) || EKURHULENI_SUBREGIONS[0];
      return {
        label: sub.id === 'all-ekurhuleni' ? 'Ekurhuleni (Benoni, Boksburg, Brakpan & Springs)' : `${sub.name}, Ekurhuleni`,
        shortLabel: sub.name,
        center: sub.center,
        radiusMeters: sub.radiusMeters
      };
    }
    if (selectedProvinceId === 'near-me' && nearestProvince) {
      return {
        label: nearestProvince.name,
        shortLabel: nearestProvince.shortName,
        center: location || nearestProvince.center,
        radiusMeters: 25000
      };
    }
    if (selectedProvinceId !== 'all' && selectedProvinceId !== 'near-me') {
      const match = SA_PROVINCES.find(p => p.id === selectedProvinceId);
      if (match) {
        return {
          label: match.name,
          shortLabel: match.name,
          center: match.center,
          radiusMeters: 35000
        };
      }
    }
    return {
      label: 'All South Africa',
      shortLabel: 'South Africa',
      center: location || { lat: -26.2050, lng: 28.3350 },
      radiusMeters: 45000
    };
  }, [selectedProvinceId, selectedEkurhuleniSubRegion, nearestProvince, location]);

  // Convert curated date spots into DiscoverItems matching current filters
  const getCuratedDateSpotsAsDiscoverItems = useCallback(
    (searchFilter?: string): DiscoverItem[] => {
      let spots = [...ALL_PROVINCES_DATE_SPOTS];

      if (selectedProvinceId === 'ekurhuleni') {
        spots = spots.filter(s => s.provinceId === 'ekurhuleni');
        if (selectedEkurhuleniSubRegion !== 'all-ekurhuleni') {
          spots = spots.filter(s => s.subRegionId === selectedEkurhuleniSubRegion);
        }
      } else if (selectedProvinceId === 'near-me' && nearestProvince) {
        if (nearestProvince.id === 'gp' || nearestProvince.id === 'ekurhuleni') {
          spots = spots.filter(s => s.provinceId === 'gp' || s.provinceId === 'ekurhuleni');
        } else {
          spots = spots.filter(s => s.provinceId === nearestProvince.id);
        }
      } else if (selectedProvinceId === 'gp') {
        spots = spots.filter(s => s.provinceId === 'gp' || s.provinceId === 'ekurhuleni');
      } else if (selectedProvinceId !== 'all' && selectedProvinceId !== 'near-me') {
        spots = spots.filter(s => s.provinceId === selectedProvinceId);
      }

      if (selectedMood !== 'all') {
        spots = spots.filter(s => s.mood === selectedMood);
      }

      if (selectedExperienceCat !== 'all') {
        const catSpec = EXPERIENCE_CATEGORIES.find(c => c.id === selectedExperienceCat);
        if (catSpec) {
          const catFiltered = spots.filter(s =>
            catSpec.keywords.test(`${s.name} ${s.category} ${s.summary} ${s.mood}`)
          );
          if (catFiltered.length > 0) {
            spots = catFiltered;
          }
        }
      }

      const trimmedSearch = (searchFilter ?? queryStr).trim().toLowerCase();
      if (trimmedSearch) {
        const textMatches = spots.filter(s =>
          `${s.name} ${s.address} ${s.category} ${s.summary} ${s.subRegionId || ''}`
            .toLowerCase()
            .includes(trimmedSearch)
        );
        if (textMatches.length > 0) {
          spots = textMatches;
        }
      }

      if (location) {
        spots.sort((a, b) => {
          const distA = calculateDistanceKm(location.lat, location.lng, a.location.lat, a.location.lng);
          const distB = calculateDistanceKm(location.lat, location.lng, b.location.lat, b.location.lng);
          return distA - distB;
        });
      }

      return spots.map(spot => {
        const prov = SA_PROVINCES.find(p => p.id === spot.provinceId);
        const dist = location
          ? calculateDistanceKm(location.lat, location.lng, spot.location.lat, spot.location.lng)
          : null;
        const cachedEnrichment = discoverPlacesCache[spot.id] || {};

        return {
          id: spot.id,
          title: spot.name,
          summary: spot.summary,
          category: spot.category,
          estimatedBudget: spot.estimatedBudgetZar,
          address: spot.address,
          location: spot.location,
          rating: spot.rating,
          userRatingCount: spot.userRatingCount,
          priceLevel: normalizePriceBadge(spot.priceLevel, spot.estimatedBudgetZar),
          subRegionId: spot.subRegionId,
          mood: spot.mood,
          imageSearchTerm: `${spot.name} ${spot.address}`,
          sourceName:
            dist !== null
              ? `${dist} km away · ${spot.address.split(',').slice(-2).join(',').trim()}`
              : spot.address || prov?.name || 'South Africa',
          isAiGenerated: false,
          isGoogleMapsPlace: Boolean(cachedEnrichment.placeId),
          ...cachedEnrichment
        };
      });
    },
    [selectedProvinceId, selectedEkurhuleniSubRegion, nearestProvince, selectedMood, selectedExperienceCat, queryStr, location]
  );

  // Use Google Maps Places API (New) `Place.searchByText` for general South Africa explorer
  const searchGoogleMapsPlaces = useCallback(
    async (customTextQuery?: string) => {
      if (!placesLib) return;

      const catSpec = EXPERIENCE_CATEGORIES.find(c => c.id === selectedExperienceCat) || EXPERIENCE_CATEGORIES[0];
      const moodWord = selectedMood !== 'all' ? selectedMood.toLowerCase() : '';
      const baseQuery = (customTextQuery ?? queryStr).trim() || `${moodWord} ${catSpec.placesQuery}`.trim();
      const regionSuffix =
        selectedProvinceId === 'ekurhuleni'
          ? selectedEkurhuleniSubRegion === 'all-ekurhuleni'
            ? 'in Benoni Boksburg Brakpan Springs Ekurhuleni South Africa'
            : `in ${activeRegionContext.shortLabel} Ekurhuleni South Africa`
          : `in ${activeRegionContext.shortLabel} South Africa`;

      const fullPlacesQuery = `${baseQuery} ${regionSuffix}`.trim();
      const cacheKey = `${fullPlacesQuery}_${activeRegionContext.center.lat.toFixed(3)}_${activeRegionContext.center.lng.toFixed(3)}`;

      if (discoverSearchCache[cacheKey]) {
        const cachedPlaces = discoverSearchCache[cacheKey];
        setResults(prev => {
          const existingTitles = new Set(cachedPlaces.map(p => p.title.toLowerCase()));
          const merged = [...cachedPlaces, ...prev.filter(p => !existingTitles.has(p.title.toLowerCase()))];
          return merged.slice(0, 24);
        });
        return;
      }

      setIsSearchingGooglePlaces(true);
      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: fullPlacesQuery,
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'priceLevel',
            'photos',
            'reviews',
            'editorialSummary',
            'websiteURI',
            'googleMapsURI'
          ],
          locationBias: {
            center: activeRegionContext.center,
            radius: activeRegionContext.radiusMeters
          },
          maxResultCount: 10
        });

        if (places && places.length > 0) {
          const mappedPlaces: DiscoverItem[] = places.map((p: any, idx: number) => {
            const loc = p.location
              ? { lat: p.location.lat(), lng: p.location.lng() }
              : activeRegionContext.center;
            const dist = location
              ? calculateDistanceKm(location.lat, location.lng, loc.lat, loc.lng)
              : null;

            const photoUris: string[] = Array.isArray(p.photos)
              ? p.photos.slice(0, 4).map((ph: any) => ph.getURI({ maxWidth: 800, maxHeight: 500 }))
              : [];

            const reviewSnippets: DiscoverReviewSnippet[] = Array.isArray(p.reviews)
              ? p.reviews.slice(0, 3).map((rv: any) => ({
                  authorName: rv.authorAttribution?.displayName || 'Google Maps Reviewer',
                  rating: rv.rating || 5,
                  text: rv.text || '',
                  relativeTime: rv.relativePublishTimeDescription || ''
                }))
              : [];

            const estBudget = estimateRandFromPriceLevel(p.priceLevel as string, 480);
            const firstReviewText = reviewSnippets[0]?.text
              ? `"${reviewSnippets[0].text.slice(0, 140)}${reviewSnippets[0].text.length > 140 ? '...' : ''}"`
              : '';

            return {
              id: p.id || `gmp-place-${idx}-${Date.now()}`,
              placeId: p.id,
              title: p.displayName || 'Romantic Venue',
              summary:
                p.editorialSummary ||
                firstReviewText ||
                `Highly rated ${catSpec.shortLabel.toLowerCase()} destination located at ${p.formattedAddress || activeRegionContext.shortLabel}.`,
              category: catSpec.id === 'all' ? 'Google Maps Verified Spot' : catSpec.shortLabel,
              estimatedBudget: estBudget,
              address: p.formattedAddress || activeRegionContext.shortLabel,
              location: loc,
              rating: p.rating ?? 4.6,
              userRatingCount: p.userRatingCount ?? 85,
              priceLevel: normalizePriceBadge(p.priceLevel as string, estBudget),
              photoUrl: photoUris[0],
              photos: photoUris,
              reviews: reviewSnippets,
              googleMapsURI: p.googleMapsURI || undefined,
              websiteURI: p.websiteURI || undefined,
              sourceName:
                dist !== null
                  ? `${dist} km away · ${p.formattedAddress || activeRegionContext.shortLabel}`
                  : p.formattedAddress || activeRegionContext.shortLabel,
              mood: selectedMood !== 'all' ? selectedMood : undefined,
              isAiGenerated: false,
              isGoogleMapsPlace: true
            };
          });

          discoverSearchCache[cacheKey] = mappedPlaces;

          setResults(prev => {
            const seenTitles = new Set<string>();
            const combined: DiscoverItem[] = [];
            for (const item of [...mappedPlaces, ...prev]) {
              const key = item.title.toLowerCase().trim();
              if (!seenTitles.has(key)) {
                seenTitles.add(key);
                combined.push(item);
              }
            }
            return combined.slice(0, 24);
          });
        }
      } catch (err: any) {
        if (
          String(err?.message || err).includes('429') ||
          String(err?.message || err).includes('RESOURCE_EXHAUSTED')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      } finally {
        setIsSearchingGooglePlaces(false);
      }
    },
    [
      placesLib,
      selectedExperienceCat,
      selectedMood,
      queryStr,
      selectedProvinceId,
      selectedEkurhuleniSubRegion,
      activeRegionContext,
      location
    ]
  );

  // Handle Google Maps Places Autocomplete as user types in search input
  const handleSearchInputChange = async (value: string) => {
    setQueryStr(value);
    if (!value.trim() || value.trim().length < 2 || !placesLib) {
      setPlacePredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      }
      const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        sessionToken: sessionTokenRef.current,
        locationBias: {
          center: activeRegionContext.center,
          radius: activeRegionContext.radiusMeters
        }
      });
      setPlacePredictions(res.suggestions || []);
      setShowPredictions((res.suggestions || []).length > 0);
    } catch (err: any) {
      if (
        String(err?.message || err).includes('429') ||
        String(err?.message || err).includes('RESOURCE_EXHAUSTED')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    }
  };

  // Select a live Google Maps Autocomplete prediction
  const handleSelectPrediction = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    setShowPredictions(false);
    setPlacePredictions([]);
    if (!placesLib || !suggestion.placePrediction) return;

    hapticMedium();
    setIsSearchingGooglePlaces(true);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'userRatingCount',
          'priceLevel',
          'photos',
          'reviews',
          'editorialSummary',
          'websiteURI',
          'googleMapsURI'
        ]
      });

      const loc = place.location
        ? { lat: place.location.lat(), lng: place.location.lng() }
        : activeRegionContext.center;
      const dist = location
        ? calculateDistanceKm(location.lat, location.lng, loc.lat, loc.lng)
        : null;
      const photoUris: string[] = Array.isArray((place as any).photos)
        ? (place as any).photos.slice(0, 4).map((ph: any) => ph.getURI({ maxWidth: 800, maxHeight: 500 }))
        : [];
      const reviewSnippets: DiscoverReviewSnippet[] = Array.isArray((place as any).reviews)
        ? (place as any).reviews.slice(0, 3).map((rv: any) => ({
            authorName: rv.authorAttribution?.displayName || 'Google Maps Reviewer',
            rating: rv.rating || 5,
            text: rv.text || '',
            relativeTime: rv.relativePublishTimeDescription || ''
          }))
        : [];
      const estBudget = estimateRandFromPriceLevel(place.priceLevel as string, 520);

      const newSpot: DiscoverItem = {
        id: place.id || `pred-${Date.now()}`,
        placeId: place.id,
        title: place.displayName || suggestion.placePrediction.text.text,
        summary:
          (place as any).editorialSummary ||
          (reviewSnippets[0]?.text ? `"${reviewSnippets[0].text.slice(0, 150)}..."` : '') ||
          `Discovered via Google Maps Places at ${place.formattedAddress || activeRegionContext.shortLabel}.`,
        category: 'Google Maps Place',
        estimatedBudget: estBudget,
        address: place.formattedAddress || activeRegionContext.shortLabel,
        location: loc,
        rating: place.rating ?? 4.7,
        userRatingCount: place.userRatingCount ?? 95,
        priceLevel: normalizePriceBadge(place.priceLevel as string, estBudget),
        photoUrl: photoUris[0],
        photos: photoUris,
        reviews: reviewSnippets,
        googleMapsURI: (place as any).googleMapsURI || undefined,
        websiteURI: (place as any).websiteURI || undefined,
        sourceName:
          dist !== null
            ? `${dist} km away · ${place.formattedAddress || ''}`
            : place.formattedAddress || activeRegionContext.shortLabel,
        isGoogleMapsPlace: true
      };

      setQueryStr(newSpot.title);
      setResults(prev => [newSpot, ...prev.filter(p => p.title !== newSpot.title)]);
      setInspectedItem(newSpot);
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    } catch (err: any) {
      if (
        String(err?.message || err).includes('429') ||
        String(err?.message || err).includes('RESOURCE_EXHAUSTED')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setIsSearchingGooglePlaces(false);
    }
  };

  // Load curated spots + live Google Maps Places + optional AI ideas for the national explorer
  const runDiscoverSearch = useCallback(
    async (customSearch?: string) => {
      const searchVal = customSearch !== undefined ? customSearch : queryStr;
      setShowPredictions(false);

      const curatedItems = getCuratedDateSpotsAsDiscoverItems(searchVal);
      setResults(curatedItems);

      if (placesLib) {
        await searchGoogleMapsPlaces(searchVal);
      }

      if (searchVal.trim().length > 2 && curatedItems.length < 3) {
        setLoading(true);
        try {
          const aiData = await discoverDateIdeas({
            query: searchVal,
            goals: goals.map(g => ({ name: g.name })),
            events: events.map(e => ({ title: e.title })),
            location: activeRegionContext.center,
            provinceName: activeRegionContext.label,
            mood: selectedMood === 'all' ? undefined : selectedMood
          });
          if (aiData && aiData.length > 0) {
            setResults(prev => {
              const existing = new Set(prev.map(p => p.title.toLowerCase()));
              return [...prev, ...aiData.filter(a => !existing.has(a.title.toLowerCase()))];
            });
          }
        } catch {
          // Curated + Google Maps Places already displayed
        } finally {
          setLoading(false);
        }
      }
    },
    [
      queryStr,
      getCuratedDateSpotsAsDiscoverItems,
      placesLib,
      searchGoogleMapsPlaces,
      goals,
      events,
      activeRegionContext,
      selectedMood
    ]
  );

  useEffect(() => {
    runDiscoverSearch();
  }, [selectedProvinceId, selectedEkurhuleniSubRegion, selectedExperienceCat, selectedMood, placesLib]);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const goalsContext = goals.map(g => ({ name: g.name }));
        const data = await fetchDiscoverSuggestions(goalsContext);
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
        }
      } catch {
        // Fallback handled in aiClient
      }
    };
    loadSuggestions();
  }, [goals.length]);

  // Fetch live weather & sunset when a user opens the venue inspector sheet
  useEffect(() => {
    if (!inspectedItem || !inspectedItem.location) {
      setInspectedWeather(null);
      return;
    }
    let isCancelled = false;
    setIsLoadingWeather(true);
    fetchSpotWeather(inspectedItem.location.lat, inspectedItem.location.lng)
      .then(w => {
        if (!isCancelled) setInspectedWeather(w);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingWeather(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [inspectedItem?.id, inspectedItem?.title]);

  const activeEkurhuleniTownObj = EKURHULENI_TOWNS.find(t => t.id === ekurhuleniTown) || EKURHULENI_TOWNS[0];

  return (
    <div className="space-y-8 pb-20">
      {/* Top Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Compass className="w-4 h-4" />
            <span>Google Maps Places API · Live Date Spot Discovery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-on-surface tracking-tight">
            Discover Romance & Cozy Dates
          </h1>
          <p className="text-xs sm:text-sm text-outline max-w-2xl">
            Curated and live Google Places date venues across{' '}
            <strong className="text-on-surface font-semibold">
              Benoni, Boksburg, Brakpan & Springs (Ekurhuleni)
            </strong>{' '}
            and all 9 South African provinces.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenMap && (
            <Button
              variant="outline"
              size="sm"
              icon={<MapIcon className="w-3.5 h-3.5 text-primary" />}
              onClick={() => {
                hapticLight();
                onOpenMap();
              }}
            >
              Interactive 3D Map
            </Button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DEDICATED 'EKURHULENI DISCOVER' SECTION (Benoni, Boksburg, Brakpan, Springs) */}
      {/* Categorized into 'Cozy', 'Active', and 'Romantic' via Google Places API */}
      {/* ===================================================================== */}
      <section
        aria-label="Ekurhuleni Discover"
        className="rounded-3xl bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10 border border-primary/20 p-5 sm:p-6 space-y-5 shadow-xs"
      >
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/15 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>East Rand Spotlight · Powered by Google Places API</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Ekurhuleni Discover
            </h2>
            <p className="text-xs sm:text-sm text-outline max-w-2xl">
              Popular date spots, hidden garden cafés, lakeside walks, and romantic dining across{' '}
              <span className="text-on-surface font-medium">Benoni, Boksburg, Brakpan, and Springs</span> — categorized into{' '}
              <span className="text-on-surface font-medium">Cozy</span>,{' '}
              <span className="text-on-surface font-medium">Active</span>, and{' '}
              <span className="text-on-surface font-medium">Romantic</span> experiences.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={
                isLoadingEkurhuleniPlaces ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-primary" />
                )
              }
              onClick={() => {
                hapticMedium();
                fetchEkurhuleniGooglePlaces(ekurhuleniTown, ekurhuleniCategory, true);
              }}
            >
              {isLoadingEkurhuleniPlaces ? 'Fetching Places...' : 'Refresh Google Places'}
            </Button>
          </div>
        </div>

        {/* Filter Controls: 1. Town Selector (All, Benoni, Boksburg, Brakpan, Springs) */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-outline">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                1. Choose Ekurhuleni Town ({activeEkurhuleniTownObj.name})
              </span>
              <span className="text-[11px] hidden sm:inline">{activeEkurhuleniTownObj.shortDesc}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {EKURHULENI_TOWNS.map(town => {
                const isSelected = ekurhuleniTown === town.id;
                return (
                  <button
                    key={town.id}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setEkurhuleniTown(town.id);
                    }}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary-fixed shadow-xs border border-primary'
                        : 'bg-surface-container-high text-on-surface border border-outline-variant/20 hover:border-primary/40'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{town.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Controls: 2. Categorization Tabs ('All', 'Cozy', 'Active', 'Romantic') */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-outline">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                2. Filter by Date Category (Cozy · Active · Romantic)
              </span>
              {ekurhuleniCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setEkurhuleniCategory('All');
                  }}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Show All Categories
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setEkurhuleniCategory('All');
                }}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  ekurhuleniCategory === 'All'
                    ? 'bg-on-surface text-surface shadow-xs'
                    : 'bg-surface-container-high text-on-surface border border-outline-variant/20 hover:border-primary/40'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>All Spots</span>
                </span>
                <span className="text-[11px] opacity-80 tabular-nums">{ekurhuleniCategoryCounts.All}</span>
              </button>

              {EKURHULENI_CATEGORIES.map(cat => {
                const isSelected = ekurhuleniCategory === cat.id;
                const count = ekurhuleniCategoryCounts[cat.id];
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setEkurhuleniCategory(cat.id);
                    }}
                    className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary-fixed shadow-xs border border-primary'
                        : 'bg-surface-container-high text-on-surface border border-outline-variant/20 hover:border-primary/40'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {cat.icon}
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-[11px] opacity-85 tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Category Description */}
            {ekurhuleniCategory !== 'All' && (
              <p className="text-xs text-outline pt-0.5">
                {EKURHULENI_CATEGORIES.find(c => c.id === ekurhuleniCategory)?.description}
              </p>
            )}
          </div>
        </div>

        {/* Ekurhuleni Discover Cards Grid */}
        {ekurhuleniPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
            {ekurhuleniPlaces.slice(0, 9).map((spot, idx) => {
              const ekCat = classifyEkurhuleniCategory(spot);
              const townLabel = detectEkurhuleniTownLabel(spot);
              return (
                <DiscoverCard
                  key={spot.id || `ek-${spot.title}-${idx}`}
                  idea={spot}
                  badgeLabel={`${ekCat} · ${townLabel}`}
                  onInspect={() => {
                    hapticLight();
                    setInspectedItem(spot);
                  }}
                  onPlanDate={onPlanDate}
                  onAddToWishlist={onAddToWishlist}
                  onFundDateGoal={onFundDateGoal}
                  onShareSpotToChat={onShareSpotToChat}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-outline">
            Loading Ekurhuleni date spots from Google Places...
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* NATIONAL & REGIONAL GOOGLE MAPS PLACES SEARCH & EXPLORER              */}
      {/* ===================================================================== */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-on-surface">
            Search All South Africa & Custom Places
          </h2>
          <p className="text-xs text-outline">
            Search any restaurant, vineyard, nature reserve, or activity across all 9 provinces using live Google Places autocomplete.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder={`Search Google Maps Places in ${activeRegionContext.shortLabel} (e.g. cozy café Benoni, steakhouse Boksburg, picnic Springs)...`}
            className="w-full bg-surface-container text-on-surface rounded-2xl py-3.5 pl-12 pr-32 outline-none focus:border-primary border border-outline-variant/20 text-sm shadow-xs placeholder:text-outline/50"
            value={queryStr}
            onChange={e => handleSearchInputChange(e.target.value)}
            onFocus={() => {
              if (placePredictions.length > 0) setShowPredictions(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setShowPredictions(false);
                runDiscoverSearch(queryStr);
              }
            }}
          />
          {queryStr && (
            <button
              type="button"
              onClick={() => {
                setQueryStr('');
                setPlacePredictions([]);
                setShowPredictions(false);
                runDiscoverSearch('');
              }}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1.5 text-outline hover:text-on-surface cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button
            variant="primary"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => {
              setShowPredictions(false);
              runDiscoverSearch(queryStr);
            }}
          >
            Explore
          </Button>

          {/* Live Google Maps Places Autocomplete Dropdown */}
          {showPredictions && placePredictions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-surface-container-high border border-outline-variant/25 rounded-2xl shadow-xl overflow-hidden divide-y divide-outline-variant/10">
              <div className="px-3.5 py-2 bg-surface-container text-[11px] font-semibold text-outline flex items-center justify-between">
                <span>Live Google Maps Places Matches</span>
                <button
                  type="button"
                  onClick={() => setShowPredictions(false)}
                  className="text-outline hover:text-on-surface text-xs"
                >
                  Close
                </button>
              </div>
              {placePredictions.slice(0, 5).map((sug, idx) => {
                const text = sug.placePrediction?.text?.text || 'Place';
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPrediction(sug)}
                    className="w-full px-4 py-3 text-left hover:bg-primary/10 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm text-on-surface truncate">{text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Quick Prompt Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-semibold text-outline flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-secondary" /> Suggested searches:
            </span>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQueryStr(s);
                  runDiscoverSearch(s);
                }}
                className="text-xs bg-surface-container-high text-on-surface hover:border-primary/40 px-3 py-1 rounded-xl transition-colors border border-outline-variant/15 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Experience Category Tabs */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-outline">
            <span className="text-[11px] uppercase tracking-wider">
              Date Style & Experience Type
            </span>
            {selectedExperienceCat !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSelectedExperienceCat('all');
                }}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
              >
                Show All Types
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {EXPERIENCE_CATEGORIES.map(cat => {
              const isSelected = selectedExperienceCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSelectedExperienceCat(cat.id);
                  }}
                  className={`min-h-[38px] flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-secondary text-on-secondary shadow-xs'
                      : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-secondary/40'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* South African Province & Region Selector Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-outline">
            <span className="text-[11px] uppercase tracking-wider">
              Province / Region ({activeRegionContext.shortLabel})
            </span>
            {selectedProvinceId !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSelectedProvinceId('all');
                }}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
              >
                View All 9 Provinces
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {location && (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSelectedProvinceId('near-me');
                }}
                className={`min-h-[36px] flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedProvinceId === 'near-me'
                    ? 'bg-primary text-on-primary-fixed shadow-xs border border-primary'
                    : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-primary/40'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Near Me {nearestProvince ? `(${nearestProvince.shortName})` : ''}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                hapticLight();
                setSelectedProvinceId('all');
              }}
              className={`min-h-[36px] flex items-center gap-1 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedProvinceId === 'all'
                  ? 'bg-primary text-on-primary-fixed shadow-xs border border-primary'
                  : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-primary/40'
              }`}
            >
              <span>All South Africa</span>
            </button>

            {SA_PROVINCES.map(prov => {
              const isSelected = selectedProvinceId === prov.id;
              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSelectedProvinceId(prov.id);
                    if (prov.id === 'ekurhuleni') {
                      setSelectedEkurhuleniSubRegion('all-ekurhuleni');
                    }
                  }}
                  className={`min-h-[36px] flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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

        {/* Mood & Vibe Filter Row */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-outline">
            <span className="text-[11px] uppercase tracking-wider">
              Date Mood & Vibe
            </span>
            {selectedMood !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSelectedMood('all');
                }}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
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
              className={`min-h-[34px] whitespace-nowrap px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedMood === 'all'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-high text-on-surface border border-outline-variant/15 hover:border-secondary/40'
              }`}
            >
              All Moods
            </button>

            {DATE_MOODS.map(mood => {
              const isSelected = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSelectedMood(mood.id);
                  }}
                  className={`min-h-[34px] flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
      </div>

      {/* Status Bar showing count & Google Maps live enrichment status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-outline pt-1 border-t border-outline-variant/10">
        <div>
          Showing <strong className="text-on-surface tabular-nums">{results.length}</strong> romantic & cozy date spots in{' '}
          <strong className="text-on-surface">{activeRegionContext.label}</strong>
        </div>
        {isSearchingGooglePlaces && (
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Discovering live venues via Google Maps Places API...</span>
          </div>
        )}
      </div>

      {loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-outline font-medium">
            Finding date spots in {activeRegionContext.label}...
          </p>
        </div>
      )}

      {/* Grid of Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((idea, i) => (
            <DiscoverCard
              key={idea.id || `${idea.title}-${i}`}
              idea={idea}
              onInspect={() => {
                hapticLight();
                setInspectedItem(idea);
              }}
              onPlanDate={onPlanDate}
              onAddToWishlist={onAddToWishlist}
              onFundDateGoal={onFundDateGoal}
              onShareSpotToChat={onShareSpotToChat}
            />
          ))}
        </div>
      )}

      {/* Venue Quick-Inspector BottomSheet (Photos, Reviews, Live Weather & Sunset, Actions) */}
      <BottomSheet
        isOpen={Boolean(inspectedItem)}
        onClose={() => setInspectedItem(null)}
        title={inspectedItem?.title || 'Date Venue Details'}
      >
        {inspectedItem && (
          <div className="space-y-5 pb-4">
            {inspectedItem.photos && inspectedItem.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                {inspectedItem.photos.slice(0, 2).map((phUrl, idx) => (
                  <img
                    key={idx}
                    src={phUrl}
                    alt={`${inspectedItem.title} photo ${idx + 1}`}
                    className="w-full h-44 object-cover rounded-xl bg-surface-container-highest"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            ) : inspectedItem.photoUrl ? (
              <img
                src={inspectedItem.photoUrl}
                alt={inspectedItem.title}
                className="w-full h-48 object-cover rounded-2xl bg-surface-container-highest"
                referrerPolicy="no-referrer"
              />
            ) : null}

            {/* Metadata Line (Unboxed Typography per Zero-Pill Discipline) */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-outline">
                <span className="font-semibold text-secondary">{inspectedItem.category}</span>
                <span aria-hidden="true">·</span>
                <span>{inferMoodFromItem(inspectedItem)} Vibe</span>
                {inspectedItem.rating && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-on-surface tabular-nums">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {inspectedItem.rating.toFixed(1)}
                      {inspectedItem.userRatingCount ? ` (${inspectedItem.userRatingCount})` : ''}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-serif font-bold text-primary tabular-nums">
                  ~{formatRand(inspectedItem.estimatedBudget || 480)} for two
                </span>
              </div>

              {(inspectedItem.address || inspectedItem.sourceName) && (
                <p className="text-xs text-outline flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{inspectedItem.address || inspectedItem.sourceName}</span>
                </p>
              )}
            </div>

            <p className="text-sm text-on-surface/90 leading-relaxed">
              {inspectedItem.summary}
            </p>

            {/* Live Weather & SAST Golden Hour Sunset Box */}
            <div className="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                <span className="flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-primary" />
                  <span>Live Venue Weather & Sunset Outlook</span>
                </span>
                {isLoadingWeather && <Loader2 className="w-3.5 h-3.5 animate-spin text-outline" />}
              </div>
              {inspectedWeather ? (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-outline tabular-nums">
                    <span className="font-bold text-on-surface">{inspectedWeather.temperatureC}°C</span>
                    <span aria-hidden="true">·</span>
                    <span>{inspectedWeather.condition}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Sunset className="w-3.5 h-3.5 text-amber-400" />
                      Golden Hour {inspectedWeather.goldenHourTime} (Sunset {inspectedWeather.sunsetTime})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5" />
                      {inspectedWeather.windKmh} km/h
                    </span>
                  </div>
                  <p className="text-[11px] text-primary font-medium">
                    {inspectedWeather.dateSuitabilityNote}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-outline">
                  Checking local weather and golden-hour sunset timing...
                </p>
              )}
            </div>

            {/* Google Maps Reviews */}
            {inspectedItem.reviews && inspectedItem.reviews.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-secondary" />
                  <span>Google Maps Guest Reviews</span>
                </h4>
                <div className="space-y-2">
                  {inspectedItem.reviews.map((rev, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-3 rounded-xl bg-surface-container border border-outline-variant/10 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-on-surface">{rev.authorName}</span>
                        <span className="text-amber-400 font-bold tabular-nums">★ {rev.rating}</span>
                      </div>
                      <p className="text-xs text-on-surface/80 line-clamp-3 leading-relaxed">
                        {rev.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {onPlanDate && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Calendar className="w-4 h-4" />}
                  onClick={() => {
                    onPlanDate({
                      title: inspectedItem.title,
                      location: inspectedItem.address || inspectedItem.title,
                      description: inspectedItem.summary,
                      mood: inferMoodFromItem(inspectedItem)
                    });
                    hapticSuccess();
                    setInspectedItem(null);
                  }}
                >
                  Plan This Date
                </Button>
              )}

              {onFundDateGoal && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<PiggyBank className="w-4 h-4 text-primary" />}
                  onClick={() => {
                    onFundDateGoal({
                      name: `${inspectedItem.title} Date Fund`,
                      targetAmount: inspectedItem.estimatedBudget || 500
                    });
                    hapticSuccess();
                    setInspectedItem(null);
                  }}
                >
                  Create Savings Goal ({formatRand(inspectedItem.estimatedBudget || 500)})
                </Button>
              )}

              {onShareSpotToChat && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<MessageCircleHeart className="w-4 h-4 text-primary" />}
                  onClick={() => {
                    onShareSpotToChat({
                      id: inspectedItem.id,
                      name: inspectedItem.title,
                      category: inspectedItem.category || 'Date Spot',
                      location: inspectedItem.address || inspectedItem.sourceName || 'South Africa',
                      estimatedBudget: inspectedItem.estimatedBudget || 480,
                      rating: inspectedItem.rating,
                      photoUrl: inspectedItem.photoUrl || inspectedItem.photos?.[0],
                      summary: inspectedItem.summary,
                      mood: inferMoodFromItem(inspectedItem),
                      lat: inspectedItem.location?.lat,
                      lng: inspectedItem.location?.lng
                    });
                    hapticSuccess();
                    setInspectedItem(null);
                  }}
                >
                  Share to Partner Chat
                </Button>
              )}

              {onAddToWishlist && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<Bookmark className="w-4 h-4 text-secondary" />}
                  onClick={() => {
                    onAddToWishlist({
                      title: inspectedItem.title,
                      category: inspectedItem.category || 'Romantic Dinners',
                      notes: `${inspectedItem.summary} (${inspectedItem.address || inspectedItem.sourceName || 'South Africa'})`,
                      estimatedBudget: inspectedItem.estimatedBudget
                    });
                    hapticSuccess();
                    setInspectedItem(null);
                  }}
                >
                  Save to Wishlist
                </Button>
              )}

              <a
                href={
                  inspectedItem.googleMapsURI ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${inspectedItem.title} ${inspectedItem.address || inspectedItem.sourceName || 'South Africa'}`
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 text-primary" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

interface DiscoverCardProps {
  idea: DiscoverItem;
  badgeLabel?: string;
  onInspect: () => void;
  onPlanDate?: (info: { title: string; location: string; description?: string; mood?: DateMood }) => void;
  onAddToWishlist?: (item: { title: string; category: string; notes?: string; estimatedBudget?: number }) => void;
  onFundDateGoal?: (goalInfo: { name: string; targetAmount: number; deadline?: string }) => void;
  onShareSpotToChat?: (spot: SharedSpotPayload) => void;
}

const DiscoverCard: React.FC<DiscoverCardProps> = ({
  idea,
  badgeLabel,
  onInspect,
  onPlanDate,
  onAddToWishlist,
  onShareSpotToChat
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const inferredMood = useMemo(() => inferMoodFromItem(idea), [idea]);

  const fallbackVisual = useMemo(() => {
    const text = `${idea.title} ${idea.category} ${idea.summary}`.toLowerCase();
    if (text.includes('cozy') || text.includes('café') || text.includes('cafe') || text.includes('tea') || text.includes('bakery') || text.includes('coffee')) {
      return {
        gradient: 'from-amber-950/90 via-stone-900 to-rose-950/80',
        Icon: Coffee,
        accentText: 'Cozy Café & Hideaway'
      };
    }
    if (text.includes('dam') || text.includes('lake') || text.includes('sanctuary') || text.includes('bird') || text.includes('picnic') || text.includes('park')) {
      return {
        gradient: 'from-emerald-950/90 via-teal-950 to-slate-900',
        Icon: TreePine,
        accentText: 'Lakeside & Nature Sanctuary'
      };
    }
    if (text.includes('bowling') || text.includes('carnival') || text.includes('pottery') || text.includes('bunny') || text.includes('playful') || text.includes('active')) {
      return {
        gradient: 'from-indigo-950/90 via-purple-950/85 to-rose-950/80',
        Icon: Palette,
        accentText: 'Active Couple Experience'
      };
    }
    return {
      gradient: 'from-rose-950/90 via-stone-900 to-amber-950/80',
      Icon: Wine,
      accentText: 'Romantic Date Venue'
    };
  }, [idea.title, idea.category, idea.summary]);

  const FallbackIcon = fallbackVisual.Icon;
  const hasValidPhoto = Boolean(idea.photoUrl && !imageFailed);

  return (
    <Card
      variant="high"
      padding="none"
      className="overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md transition-all border border-outline-variant/15"
    >
      {/* Image / Editorial Visual Header */}
      <div
        onClick={onInspect}
        className="h-48 w-full relative bg-surface-container-highest overflow-hidden cursor-pointer"
      >
        {hasValidPhoto ? (
          <img
            src={idea.photoUrl}
            alt={idea.title}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${fallbackVisual.gradient} flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center mb-2 border border-white/15">
              <FallbackIcon className="w-6 h-6 text-rose-200" />
            </div>
            <span className="text-[11px] font-medium text-white/75 tracking-wide">
              {fallbackVisual.accentText}
            </span>
          </div>
        )}

        {/* Measured contrast scrim for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {/* Bottom overlay inside media frame: Category & Rating */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2 text-white">
          <div className="text-xs font-medium text-white/90 truncate">
            <span>{badgeLabel || idea.category}</span>
            <span className="mx-1.5 opacity-60">·</span>
            <span>{inferredMood}</span>
          </div>

          {idea.rating && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 shrink-0 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{idea.rating.toFixed(1)}</span>
              {idea.userRatingCount && (
                <span className="text-[11px] text-white/75 font-normal">
                  ({idea.userRatingCount})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onInspect}
            className="text-left group/title cursor-pointer"
          >
            <h3 className="font-serif text-xl font-bold text-on-surface leading-snug group-hover/title:text-primary transition-colors">
              {idea.title}
            </h3>
          </button>

          {/* Unboxed Metadata Line (Location & Source) */}
          <div className="flex items-center gap-1.5 text-xs text-outline">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{idea.sourceName || idea.address || 'South Africa'}</span>
          </div>

          <p className="text-xs text-on-surface/85 leading-relaxed line-clamp-3">
            {idea.summary}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-outline-variant/10">
          {/* Cost & Details Link Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-outline tabular-nums">
              <span>Est. Couple Cost:</span>
              <span className="font-serif font-bold text-primary text-sm">
                ~{formatRand(idea.estimatedBudget || 480)}
              </span>
            </div>

            <button
              type="button"
              onClick={onInspect}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details & Weather</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onAddToWishlist && (
              <Button
                variant="outline"
                size="sm"
                icon={<Bookmark className="w-3.5 h-3.5 text-secondary" />}
                onClick={() => {
                  onAddToWishlist({
                    title: idea.title,
                    category: idea.category || 'Romantic Dinners',
                    notes: `${idea.summary} (${idea.address || idea.sourceName || 'South Africa'})`,
                    estimatedBudget: idea.estimatedBudget
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
                    location: idea.address || idea.title,
                    description: idea.summary,
                    mood: inferredMood
                  });
                  hapticSuccess();
                }}
              >
                Plan Date
              </Button>
            )}
          </div>

          {onShareSpotToChat && (
            <button
              type="button"
              onClick={() => {
                hapticSuccess();
                onShareSpotToChat({
                  id: idea.id,
                  name: idea.title,
                  category: badgeLabel || idea.category || 'Date Spot',
                  location: idea.address || idea.sourceName || 'South Africa',
                  estimatedBudget: idea.estimatedBudget || 480,
                  rating: idea.rating,
                  photoUrl: idea.photoUrl || idea.photos?.[0],
                  summary: idea.summary,
                  mood: inferredMood,
                  lat: idea.location?.lat,
                  lng: idea.location?.lng
                });
              }}
              className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-primary/10 text-primary border border-primary/25 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircleHeart className="w-3.5 h-3.5 shrink-0" />
              <span>Share Spot to Partner Chat</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default function DiscoverView(props: DiscoverViewProps) {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyDZsBhSTppoy_W69liV_F60NQJMDBcOHeo';

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'routes', 'streetView']}>
      <DiscoverContent {...props} />
    </APIProvider>
  );
}
