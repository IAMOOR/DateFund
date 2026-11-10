/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  Search,
  MapPin,
  Compass,
  Star,
  Plus,
  Bookmark,
  Calendar,
  Navigation,
  ExternalLink,
  Layers,
  Utensils,
  Wine,
  Coffee,
  TreePine,
  Sparkles,
  Heart,
  Loader2,
  X,
  List,
  Map as MapIcon,
  Filter,
  ChevronDown,
  Check,
  RotateCcw,
  Wand2,
  CloudSun,
  Wind,
  Droplets,
  Sunset,
  Route as RouteIcon,
  Car,
  Footprints,
  Eye,
  Building2,
  Satellite,
  RotateCw,
  PiggyBank,
  Trash2,
  MessageSquareQuote,
  Clock,
  Camera,
  MessageCircleHeart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Event, DateMood, SharedSpotPayload } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MoodBadge } from '../ui/MoodBadge';
import { hapticLight, hapticMedium, hapticSuccess } from '../../utils/haptics';
import {
  SA_PROVINCES,
  ALL_PROVINCES_DATE_SPOTS,
  calculateDistanceKm,
  getNearestProvince
} from '../../utils/provinces';
import {
  generateMapDateItinerary,
  fetchSpotWeather,
  AiMapItinerary,
  SpotWeatherConditions
} from '../../utils/aiClient';
import { formatRand } from '../../utils/formatters';

// Default initial center (South Africa)
const DEFAULT_CENTER = { lat: -29.0, lng: 25.0 };

export type PlaceCategoryFilter = 'all' | 'Romantic' | 'Adventurous' | 'Cozy';

export interface PlaceCategoryOption {
  id: PlaceCategoryFilter;
  label: string;
  shortLabel: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  badgeText: string;
  colorClass: string;
  activePillClass: string;
  description: string;
  placesQuery: string;
}

export const PLACE_CATEGORY_OPTIONS: PlaceCategoryOption[] = [
  {
    id: 'all',
    label: 'All Place Categories',
    shortLabel: 'All Places',
    emoji: '✨',
    icon: Sparkles,
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary',
    colorClass: 'bg-primary text-on-primary-fixed',
    activePillClass: 'bg-primary text-on-primary-fixed border-primary shadow-xs',
    description: 'Every curated date destination, adventure spot, and cozy hideaway across SA',
    placesQuery: 'best couple date venues South Africa',
  },
  {
    id: 'Romantic',
    label: 'Romantic',
    shortLabel: 'Romantic',
    emoji: '🌹',
    icon: Wine,
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-600 dark:text-rose-400',
    colorClass: 'bg-rose-600 text-white',
    activePillClass: 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-500/30',
    description: 'Candlelight fine dining, boutique wine estates, ocean sunset lookouts & rooftop lounges',
    placesQuery: 'romantic fine dining restaurant wine estate sunset couple South Africa',
  },
  {
    id: 'Adventurous',
    label: 'Adventurous',
    shortLabel: 'Adventurous',
    emoji: '🌲',
    icon: TreePine,
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    colorClass: 'bg-emerald-600 text-white',
    activePillClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30',
    description: 'Scenic hiking trails, mountain cableways, canopy tours, nature gorges & safaris',
    placesQuery: 'scenic outdoor couple adventure hike cableway viewpoint safari South Africa',
  },
  {
    id: 'Cozy',
    label: 'Cozy',
    shortLabel: 'Cozy',
    emoji: '☕',
    icon: Coffee,
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
    colorClass: 'bg-amber-600 text-white',
    activePillClass: 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-500/30',
    description: 'Artisan bakeries, intimate coffee houses, fireplace bistros, tea gardens & hideaways',
    placesQuery: 'cozy intimate aesthetic cafe fireplace bistro couple picnic bakery South Africa',
  },
];

export function spotMatchesCategory(spot: PlaceSpot, cat: PlaceCategoryFilter): boolean {
  if (cat === 'all') return true;

  const text = `${spot.name} ${spot.category || ''} ${spot.summary || ''} ${spot.mood || ''}`.toLowerCase();

  if (cat === 'Romantic') {
    if (spot.mood === 'Romantic' || spot.mood === 'Luxurious') return true;
    return /romantic|fine dining|wine|dinner|sunset|cocktail|candle|intimate dining|rooftop|oyster|vineyard|chateau|terrace/i.test(text);
  }

  if (cat === 'Adventurous') {
    if (spot.mood === 'Adventurous' || spot.mood === 'Playful') return true;
    return /adventur|hike|trail|cableway|canopy|bridge|mountain|safari|kayak|falls|river|climb|gorge|quad|scenic walk|drakensberg|bluff|viewpoint/i.test(text);
  }

  if (cat === 'Cozy') {
    if (spot.mood === 'Cozy' || spot.mood === 'Relaxed') return true;
    return /cozy|cafe|café|bistro|fireplace|bakery|coffee|tea|picnic|garden|hideaway|cottage|pastry|patisserie|bookshop/i.test(text);
  }

  return false;
}

export function getSpotCategory(spot: PlaceSpot): PlaceCategoryFilter {
  if (spotMatchesCategory(spot, 'Romantic')) return 'Romantic';
  if (spotMatchesCategory(spot, 'Adventurous')) return 'Adventurous';
  if (spotMatchesCategory(spot, 'Cozy')) return 'Cozy';
  return 'Romantic';
}

export function getSpotCategoryOption(spot: PlaceSpot): PlaceCategoryOption {
  const cat = getSpotCategory(spot);
  return PLACE_CATEGORY_OPTIONS.find(o => o.id === cat) || PLACE_CATEGORY_OPTIONS[1];
}

export interface PlaceReviewSnippet {
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

export interface PlaceSpot {
  id: string;
  placeId?: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  estimatedCostRand?: number;
  stayDurationMinutes?: number;
  insiderTip?: string;
  category?: string;
  summary?: string;
  provinceId?: string;
  mood?: DateMood;
  distanceKm?: number;
  photos?: string[];
  reviews?: PlaceReviewSnippet[];
  isOpenNow?: boolean;
  websiteURI?: string;
  googleMapsURI?: string;
}

export interface RouteLegSummary {
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMinutes: number;
  instruction?: string;
}

export interface ComputedDateRoute {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalEstimatedCostRand: number;
  travelMode: 'DRIVING' | 'WALKING';
  legs: RouteLegSummary[];
}

export interface GoogleDateMapProps {
  events?: Event[];
  onPlanDate?: (dateInfo: { title: string; location: string; description?: string; mood?: DateMood }) => void;
  onAddToBucketList?: (item: { title: string; category: string; notes?: string }) => void;
  onFundDateGoal?: (goalInfo: { name: string; targetAmount: number; deadline?: string }) => void;
  onShareSpotToChat?: (spot: SharedSpotPayload) => void;
  focusedSpot?: SharedSpotPayload | null;
  userLocation?: { lat: number; lng: number } | null;
}

const AI_MAP_PROMPT_IDEAS = [
  'Sunset wine & candlelit dinner in Stellenbosch',
  'Cozy rainy day cafés & art gallery in Joburg',
  'Oceanfront walk & seafood terrace in Umhlanga',
  'Scenic cableway adventure & rooftop cocktails'
];

function estimateSpotCostRand(spot: PlaceSpot): number {
  if (typeof spot.estimatedCostRand === 'number' && spot.estimatedCostRand > 0) {
    return spot.estimatedCostRand;
  }
  const priceStr = String(spot.priceLevel || '');
  if (priceStr.includes('RRRR') || priceStr.includes('VERY_EXPENSIVE')) return 1400;
  if (priceStr.includes('RRR') || priceStr.includes('EXPENSIVE')) return 950;
  if (priceStr.includes('RR') || priceStr.includes('MODERATE')) return 550;
  if (priceStr.includes('R') || priceStr.includes('INEXPENSIVE')) return 280;
  const cat = getSpotCategory(spot);
  if (cat === 'Romantic') return 850;
  if (cat === 'Adventurous') return 420;
  return 320;
}

function normalizePriceTier(rawPrice?: string): string {
  if (!rawPrice) return 'RR';
  if (rawPrice.startsWith('R')) return rawPrice;
  switch (rawPrice) {
    case 'INEXPENSIVE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 'R';
    case 'MODERATE':
    case 'PRICE_LEVEL_MODERATE':
      return 'RR';
    case 'EXPENSIVE':
    case 'PRICE_LEVEL_EXPENSIVE':
      return 'RRR';
    case 'VERY_EXPENSIVE':
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 'RRRR';
    default:
      return rawPrice;
  }
}

// Interactive Street View Panorama Component
function VenueStreetViewPanel({
  location,
  venueName,
  onSwitchTo3DAerial
}: {
  location: { lat: number; lng: number };
  venueName: string;
  onSwitchTo3DAerial?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const streetViewLib = useMapsLibrary('streetView');
  const [status, setStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');

  useEffect(() => {
    if (!streetViewLib || !containerRef.current) return;
    let isCancelled = false;

    setStatus('loading');
    const svService = new streetViewLib.StreetViewService();

    svService.getPanorama(
      {
        location,
        radius: 180,
        source: google.maps.StreetViewSource.OUTDOOR
      },
      (data, svStatus) => {
        if (isCancelled) return;
        if (svStatus === google.maps.StreetViewStatus.OK && data?.location?.latLng && containerRef.current) {
          setStatus('available');
          new streetViewLib.StreetViewPanorama(containerRef.current, {
            position: data.location.latLng,
            pov: { heading: 165, pitch: 5 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: true,
            motionTracking: false,
            fullscreenControl: true
          });
        } else {
          setStatus('unavailable');
        }
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [streetViewLib, location.lat, location.lng]);

  return (
    <div className="relative w-full h-60 sm:h-72 rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-highest">
      <div ref={containerRef} className="w-full h-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container/90 backdrop-blur-xs text-xs text-outline">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading 360° Street View for {venueName}...</span>
        </div>
      )}
      {status === 'unavailable' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-5 text-center bg-surface-container-high">
          <Camera className="w-7 h-7 text-primary/70" />
          <div className="space-y-1 max-w-xs">
            <p className="text-xs font-bold text-on-surface">
              Private Estate / Off-Road Location
            </p>
            <p className="text-[11px] text-outline leading-relaxed">
              {venueName} is tucked inside a private vineyard, garden, or pedestrian trail without road-car cameras.
            </p>
          </div>
          {onSwitchTo3DAerial && (
            <button
              type="button"
              onClick={onSwitchTo3DAerial}
              className="mt-1 px-3.5 py-2 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Fly to 3D Aerial View on Map</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Note: Never use `new Map()` in this file because `Map` is imported from `@vis.gl/react-google-maps`.
// Use `Record<string, ...>` for all lookup tables and caches.
const enrichedVenueCache: Record<string, Partial<PlaceSpot>> = {};

function MapContent({
  onPlanDate,
  onAddToBucketList,
  onFundDateGoal,
  onShareSpotToChat,
  focusedSpot,
  userLocation
}: GoogleDateMapProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // AI Natural-Language Map Concierge state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiBuildingMap, setIsAiBuildingMap] = useState(false);
  const [activeAiItinerary, setActiveAiItinerary] = useState<AiMapItinerary | null>(null);

  // Map 3D, Satellite, Traffic & StreetView Layer Controls
  const [is3DMode, setIs3DMode] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isTrafficEnabled, setIsTrafficEnabled] = useState(false);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  // Place category filter: 'all' | 'Romantic' | 'Adventurous' | 'Cozy'
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState<PlaceCategoryFilter>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Province selector: 'near-me' (if GPS available), 'all', or province id ('wc', 'gp', 'kzn', etc.)
  const [activeProvinceId, setActiveProvinceId] = useState<string>(userLocation ? 'near-me' : 'all');

  // Multi-Stop Date Route Builder state
  const [routeStops, setRouteStops] = useState<PlaceSpot[]>([]);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [computedRoute, setComputedRoute] = useState<ComputedDateRoute | null>(null);
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  // Selected Venue Inspector & Weather / Street View state
  const [selectedSpot, setSelectedSpot] = useState<PlaceSpot | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'streetview' | 'reviews'>('overview');
  const [spotWeather, setSpotWeather] = useState<SpotWeatherConditions | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isEnrichingPlace, setIsEnrichingPlace] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Convert ALL_PROVINCES_DATE_SPOTS to PlaceSpots
  const initialSpots = useMemo<PlaceSpot[]>(() => {
    return ALL_PROVINCES_DATE_SPOTS.map(s => {
      const dist = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, s.location.lat, s.location.lng) : undefined;
      return {
        id: s.id,
        name: s.name,
        address: s.address,
        location: s.location,
        rating: s.rating,
        userRatingCount: s.userRatingCount,
        priceLevel: s.priceLevel,
        category: s.category,
        summary: s.summary,
        provinceId: s.provinceId,
        mood: s.mood,
        distanceKm: dist,
      };
    });
  }, [userLocation]);

  const [spots, setSpots] = useState<PlaceSpot[]>(initialSpots);

  // When a shared spot from Partner Chat is opened via "View on Map", focus & select it
  useEffect(() => {
    if (!focusedSpot) return;
    const matched = spots.find(
      s =>
        (focusedSpot.id && s.id === focusedSpot.id) ||
        s.name.toLowerCase() === focusedSpot.name.toLowerCase()
    );
    if (matched) {
      setSelectedSpot(matched);
      if (map) {
        map.panTo(matched.location);
        map.setZoom(15);
      }
    } else if (typeof focusedSpot.lat === 'number' && typeof focusedSpot.lng === 'number') {
      const customSpot: PlaceSpot = {
        id: focusedSpot.id || `shared_${Date.now()}`,
        name: focusedSpot.name,
        address: focusedSpot.location,
        location: { lat: focusedSpot.lat, lng: focusedSpot.lng },
        rating: focusedSpot.rating,
        estimatedCostRand: focusedSpot.estimatedBudget,
        category: focusedSpot.category,
        summary: focusedSpot.summary,
        mood: focusedSpot.mood,
        photos: focusedSpot.photoUrl ? [focusedSpot.photoUrl] : undefined
      };
      setSpots(prev => [customSpot, ...prev]);
      setSelectedSpot(customSpot);
      if (map) {
        map.panTo(customSpot.location);
        map.setZoom(15);
      }
    }
  }, [focusedSpot, map]);

  // Compute nearest province
  const nearestProvince = useMemo(() => {
    if (!userLocation) return null;
    return getNearestProvince(userLocation.lat, userLocation.lng);
  }, [userLocation]);

  const currentProvinceName = useMemo(() => {
    if (activeProvinceId === 'near-me' && nearestProvince) return nearestProvince.name;
    if (activeProvinceId !== 'all' && activeProvinceId !== 'near-me') {
      return SA_PROVINCES.find(p => p.id === activeProvinceId)?.name || 'South Africa';
    }
    return 'All Provinces';
  }, [activeProvinceId, nearestProvince]);

  // Dynamic counts for each category in the current province scope
  const categoryCounts = useMemo(() => {
    let provSpots = [...initialSpots];
    const targetProvId = activeProvinceId === 'near-me' && nearestProvince ? nearestProvince.id : activeProvinceId;
    if (targetProvId === 'gp') {
      provSpots = provSpots.filter(s => s.provinceId === 'gp' || s.provinceId === 'ekurhuleni');
    } else if (targetProvId !== 'all' && targetProvId !== 'near-me') {
      provSpots = provSpots.filter(s => s.provinceId === targetProvId);
    }

    return {
      all: provSpots.length,
      Romantic: provSpots.filter(s => spotMatchesCategory(s, 'Romantic')).length,
      Adventurous: provSpots.filter(s => spotMatchesCategory(s, 'Adventurous')).length,
      Cozy: provSpots.filter(s => spotMatchesCategory(s, 'Cozy')).length,
    };
  }, [initialSpots, activeProvinceId, nearestProvince]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    if (isFilterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterMenuOpen]);

  useEffect(() => {
    if (placesLib && !sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  // Initial center on user location or national center
  useEffect(() => {
    if (map) {
      if (userLocation) {
        map.panTo(userLocation);
        map.setZoom(12);
      } else {
        map.panTo({ lat: -28.4793, lng: 24.6727 });
        map.setZoom(6);
      }
    }
  }, [userLocation, map]);

  // Sync Traffic Layer on Map
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps?.TrafficLayer) return;
    if (isTrafficEnabled) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(null);
    }
  }, [isTrafficEnabled, map]);

  // Filter spots whenever activeProvinceId or selectedPlaceCategory changes
  useEffect(() => {
    let filtered = [...initialSpots];
    const targetProvId = activeProvinceId === 'near-me' && nearestProvince ? nearestProvince.id : activeProvinceId;
    if (targetProvId === 'gp') {
      filtered = filtered.filter(s => s.provinceId === 'gp' || s.provinceId === 'ekurhuleni');
    } else if (targetProvId !== 'all' && targetProvId !== 'near-me') {
      filtered = filtered.filter(s => s.provinceId === targetProvId);
    }

    if (selectedPlaceCategory !== 'all') {
      filtered = filtered.filter(s => spotMatchesCategory(s, selectedPlaceCategory));
    }

    if (userLocation) {
      filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    setSpots(filtered);
  }, [activeProvinceId, initialSpots, nearestProvince, userLocation, selectedPlaceCategory]);

  // Fetch Live Weather & Sunset + Enrich Place details whenever selectedSpot changes
  useEffect(() => {
    if (!selectedSpot) {
      setSpotWeather(null);
      setInspectorTab('overview');
      return;
    }

    let isCancelled = false;
    setIsLoadingWeather(true);
    fetchSpotWeather(selectedSpot.location.lat, selectedSpot.location.lng)
      .then(w => {
        if (!isCancelled) setSpotWeather(w);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingWeather(false);
      });

    // Live Places API (New) enrichment for photos, reviews, open status, and price level
    const cacheKey = selectedSpot.placeId || selectedSpot.id;
    if (enrichedVenueCache[cacheKey]) {
      const cached = enrichedVenueCache[cacheKey];
      if (!selectedSpot.photos && cached.photos) {
        setSelectedSpot(prev => (prev && prev.id === selectedSpot.id ? { ...prev, ...cached } : prev));
      }
      return;
    }

    if (placesLib) {
      setIsEnrichingPlace(true);
      const enrichAsync = async () => {
        try {
          let targetPlace: any = null;
          if (selectedSpot.placeId) {
            targetPlace = new placesLib.Place({ id: selectedSpot.placeId });
            await targetPlace.fetchFields({
              fields: [
                'displayName',
                'formattedAddress',
                'rating',
                'userRatingCount',
                'priceLevel',
                'photos',
                'reviews',
                'regularOpeningHours',
                'editorialSummary',
                'websiteURI',
                'googleMapsURI'
              ]
            });
          } else {
            const { places } = await placesLib.Place.searchByText({
              textQuery: `${selectedSpot.name} ${selectedSpot.address}`,
              fields: [
                'id',
                'displayName',
                'formattedAddress',
                'rating',
                'userRatingCount',
                'priceLevel',
                'photos',
                'reviews',
                'regularOpeningHours',
                'editorialSummary',
                'websiteURI',
                'googleMapsURI'
              ],
              maxResultCount: 1
            });
            if (places && places.length > 0) {
              targetPlace = places[0];
            }
          }

          if (!isCancelled && targetPlace) {
            const photoUris: string[] = Array.isArray(targetPlace.photos)
              ? targetPlace.photos.slice(0, 4).map((ph: any) => ph.getURI({ maxWidth: 600, maxHeight: 400 }))
              : [];
            const reviewSnippets: PlaceReviewSnippet[] = Array.isArray(targetPlace.reviews)
              ? targetPlace.reviews.slice(0, 3).map((rv: any) => ({
                  authorName: rv.authorAttribution?.displayName || 'Verified Guest',
                  rating: rv.rating || 5,
                  text: rv.text || '',
                  relativeTime: rv.relativePublishTimeDescription || ''
                }))
              : [];

            const enriched: Partial<PlaceSpot> = {
              placeId: targetPlace.id || selectedSpot.placeId,
              rating: targetPlace.rating ?? selectedSpot.rating,
              userRatingCount: targetPlace.userRatingCount ?? selectedSpot.userRatingCount,
              priceLevel: normalizePriceTier(targetPlace.priceLevel as string) || selectedSpot.priceLevel,
              photos: photoUris.length > 0 ? photoUris : undefined,
              reviews: reviewSnippets.length > 0 ? reviewSnippets : undefined,
              summary: targetPlace.editorialSummary || selectedSpot.summary,
              websiteURI: targetPlace.websiteURI || undefined,
              googleMapsURI: targetPlace.googleMapsURI || undefined
            };

            enrichedVenueCache[cacheKey] = enriched;
            setSelectedSpot(prev => (prev && prev.id === selectedSpot.id ? { ...prev, ...enriched } : prev));
          }
        } catch (err: any) {
          if (String(err?.message || err).includes('429') || String(err?.message || err).includes('RESOURCE_EXHAUSTED')) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
        } finally {
          if (!isCancelled) setIsEnrichingPlace(false);
        }
      };
      enrichAsync();
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedSpot?.id, placesLib]);

  // Compute Turn-by-Turn Multi-Stop Route & Render Polyline on Map
  useEffect(() => {
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (routeStops.length < 2) {
      setComputedRoute(null);
      return;
    }

    let isCancelled = false;
    setIsComputingRoute(true);

    const computeFallbackGeodesicRoute = (): ComputedDateRoute => {
      const legs: RouteLegSummary[] = [];
      let totalDist = 0;
      let totalMins = 0;
      const speedKmh = travelMode === 'WALKING' ? 4.8 : 42;

      for (let i = 0; i < routeStops.length - 1; i++) {
        const from = routeStops[i];
        const to = routeStops[i + 1];
        const straightKm = calculateDistanceKm(from.location.lat, from.location.lng, to.location.lat, to.location.lng);
        const roadKm = Math.max(0.4, Number((straightKm * 1.28).toFixed(1)));
        const mins = Math.max(4, Math.round((roadKm / speedKmh) * 60));
        totalDist += roadKm;
        totalMins += mins;
        legs.push({
          fromName: from.name,
          toName: to.name,
          distanceKm: roadKm,
          durationMinutes: mins,
          instruction: `${travelMode === 'WALKING' ? 'Scenic walk' : 'Drive'} from ${from.name} to ${to.name}`
        });
      }

      const totalCost = routeStops.reduce((sum, s) => sum + estimateSpotCostRand(s), 0);
      return {
        totalDistanceKm: Number(totalDist.toFixed(1)),
        totalDurationMinutes: totalMins,
        totalEstimatedCostRand: totalCost,
        travelMode,
        legs
      };
    };

    const drawPolylinePath = (pathCoords: Array<{ lat: number; lng: number }>) => {
      if (!map || typeof google === 'undefined' || !google.maps?.Polyline) return;
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
      routePolylineRef.current = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#e11d48',
        strokeOpacity: 0.92,
        strokeWeight: 5,
        map
      });
    };

    const runRouteComputation = async () => {
      try {
        if (routesLib && (routesLib as any).Route?.computeRoutes) {
          const origin = routeStops[0].location;
          const destination = routeStops[routeStops.length - 1].location;
          const intermediates = routeStops.slice(1, -1).map(s => ({ location: s.location }));

          const res = await (routesLib as any).Route.computeRoutes({
            origin,
            destination,
            intermediates,
            travelMode,
            fields: ['path', 'distanceMeters', 'durationMillis', 'legs']
          });

          const routeObj = res?.routes?.[0];
          if (!isCancelled && routeObj) {
            const path = routeObj.path || routeStops.map(s => s.location);
            drawPolylinePath(path);

            const legs: RouteLegSummary[] = (routeObj.legs || []).map((leg: any, idx: number) => ({
              fromName: routeStops[idx]?.name || `Stop ${idx + 1}`,
              toName: routeStops[idx + 1]?.name || `Stop ${idx + 2}`,
              distanceKm: Number(((leg.distanceMeters || 1000) / 1000).toFixed(1)),
              durationMinutes: Math.max(2, Math.round((leg.durationMillis || 300000) / 60000)),
              instruction: `${travelMode === 'WALKING' ? 'Walk' : 'Drive'} to ${routeStops[idx + 1]?.name || 'next stop'}`
            }));

            const totalDistanceKm = Number(((routeObj.distanceMeters || 0) / 1000).toFixed(1)) ||
              legs.reduce((acc, l) => acc + l.distanceKm, 0);
            const totalDurationMinutes = Math.max(5, Math.round((routeObj.durationMillis || 0) / 60000)) ||
              legs.reduce((acc, l) => acc + l.durationMinutes, 0);
            const totalEstimatedCostRand = routeStops.reduce((sum, s) => sum + estimateSpotCostRand(s), 0);

            setComputedRoute({
              totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
              totalDurationMinutes,
              totalEstimatedCostRand,
              travelMode,
              legs: legs.length > 0 ? legs : computeFallbackGeodesicRoute().legs
            });
            return;
          }
        }
      } catch (err: any) {
        if (String(err?.message || err).includes('429') || String(err?.message || err).includes('RESOURCE_EXHAUSTED')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }

      if (!isCancelled) {
        drawPolylinePath(routeStops.map(s => s.location));
        setComputedRoute(computeFallbackGeodesicRoute());
      }
    };

    runRouteComputation().finally(() => {
      if (!isCancelled) setIsComputingRoute(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [routeStops, travelMode, routesLib, map]);

  // Toggle 3D Buildings Camera Tilt
  const handleToggle3DBuildings = () => {
    hapticLight();
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    if (!map) return;

    if (next3D) {
      const targetCenter = selectedSpot?.location || routeStops[0]?.location || map.getCenter();
      if (targetCenter) map.panTo(targetCenter);
      map.setZoom(Math.max(map.getZoom() || 15, 17));
      map.setTilt(60);
      map.setHeading(35);
    } else {
      map.setTilt(0);
      map.setHeading(0);
    }
  };

  // Rotate 3D Camera Heading by 45 degrees
  const handleRotateCamera = () => {
    hapticLight();
    if (!map) return;
    if (!is3DMode) {
      setIs3DMode(true);
      map.setTilt(60);
      map.setZoom(Math.max(map.getZoom() || 15, 17));
    }
    const currentHeading = map.getHeading() || 0;
    map.setHeading((currentHeading + 45) % 360);
  };

  // Toggle Aerial / Hybrid Satellite Mode
  const handleToggleSatellite = () => {
    hapticLight();
    const nextType = mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap';
    setMapTypeId(nextType);
    if (map) {
      map.setMapTypeId(nextType);
    }
  };

  // Add or Remove a Spot from the Multi-Stop Date Route
  const handleToggleRouteStop = (spot: PlaceSpot) => {
    hapticLight();
    setRouteStops(prev => {
      const exists = prev.some(s => s.id === spot.id);
      if (exists) {
        return prev.filter(s => s.id !== spot.id);
      }
      if (prev.length >= 5) {
        setMapError('Maximum 5 stops per date route. Remove a stop to add another.');
        return prev;
      }
      setIsRouteDrawerOpen(true);
      return [...prev, spot];
    });
  };

  // Natural-Language AI Map Builder ("Describe your idea, Gemini does the rest")
  const handleBuildAiMapItinerary = async (customPrompt?: string) => {
    const queryText = (customPrompt ?? aiPrompt).trim();
    if (!queryText) return;

    hapticMedium();
    setIsAiBuildingMap(true);
    setMapError(null);
    if (customPrompt) setAiPrompt(customPrompt);

    try {
      const itinerary = await generateMapDateItinerary({
        prompt: queryText,
        provinceName: currentProvinceName,
        location: userLocation
      });
      setActiveAiItinerary(itinerary);

      // Resolve each AI stop into a real Google Maps PlaceSpot
      const resolvedStops: PlaceSpot[] = [];
      const fallbackProvCenter =
        activeProvinceId !== 'all' && activeProvinceId !== 'near-me'
          ? SA_PROVINCES.find(p => p.id === activeProvinceId)?.center || { lat: -33.9249, lng: 18.4241 }
          : nearestProvince?.center || { lat: -33.9249, lng: 18.4241 };

      for (let idx = 0; idx < itinerary.stops.length; idx++) {
        const stopSpec = itinerary.stops[idx];
        let matchedPlaceSpot: PlaceSpot | null = null;

        if (placesLib) {
          try {
            const { places } = await placesLib.Place.searchByText({
              textQuery: stopSpec.searchQuery,
              fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'priceLevel'],
              locationBias: { center: fallbackProvCenter, radius: 45000 },
              maxResultCount: 1
            });
            if (places && places.length > 0 && places[0].location) {
              const p = places[0];
              const loc = { lat: p.location!.lat(), lng: p.location!.lng() };
              const dist = userLocation
                ? calculateDistanceKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
                : undefined;
              matchedPlaceSpot = {
                id: p.id || `ai-stop-${idx}-${Date.now()}`,
                placeId: p.id,
                name: p.displayName || stopSpec.title,
                address: p.formattedAddress || stopSpec.searchQuery,
                location: loc,
                rating: p.rating ?? 4.8,
                userRatingCount: p.userRatingCount ?? 140,
                priceLevel: normalizePriceTier(p.priceLevel as string),
                estimatedCostRand: stopSpec.estimatedCostRand,
                stayDurationMinutes: stopSpec.stayDurationMinutes,
                insiderTip: stopSpec.tip,
                category: stopSpec.category,
                summary: stopSpec.tip,
                mood: (itinerary.mood as DateMood) || 'Romantic',
                distanceKm: dist
              };
            }
          } catch {
            // Fall back to curated or offset coordinates if Places search fails
          }
        }

        if (!matchedPlaceSpot) {
          // Match closest curated spot or create regional coordinate offset
          const offsetLat = fallbackProvCenter.lat + (idx - 1) * 0.018;
          const offsetLng = fallbackProvCenter.lng + (idx - 1) * 0.022;
          const dist = userLocation
            ? calculateDistanceKm(userLocation.lat, userLocation.lng, offsetLat, offsetLng)
            : undefined;
          matchedPlaceSpot = {
            id: `ai-curated-${idx}-${Date.now()}`,
            name: stopSpec.title,
            address: stopSpec.searchQuery.replace(/South Africa$/i, '').trim(),
            location: { lat: offsetLat, lng: offsetLng },
            rating: 4.8,
            userRatingCount: 185,
            priceLevel: stopSpec.estimatedCostRand > 600 ? 'RRR' : 'RR',
            estimatedCostRand: stopSpec.estimatedCostRand,
            stayDurationMinutes: stopSpec.stayDurationMinutes,
            insiderTip: stopSpec.tip,
            category: stopSpec.category,
            summary: stopSpec.tip,
            mood: (itinerary.mood as DateMood) || 'Romantic',
            distanceKm: dist
          };
        }

        resolvedStops.push(matchedPlaceSpot);
      }

      if (resolvedStops.length > 0) {
        setSpots(prev => {
          const newIds = new Set(resolvedStops.map(r => r.id));
          return [...resolvedStops, ...prev.filter(p => !newIds.has(p.id))];
        });
        setRouteStops(resolvedStops);
        setIsRouteDrawerOpen(true);
        setSelectedSpot(resolvedStops[0]);
        setViewMode('map');

        if (map) {
          map.panTo(resolvedStops[0].location);
          map.setZoom(13);
        }
        hapticSuccess();
      }
    } catch {
      setMapError('Could not build custom map itinerary right now. Try another description.');
    } finally {
      setIsAiBuildingMap(false);
    }
  };

  const handleSelectProvince = (provId: string) => {
    hapticLight();
    setActiveProvinceId(provId);

    if (!map) return;

    if (provId === 'near-me') {
      if (userLocation) {
        map.panTo(userLocation);
        map.setZoom(13);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.panTo(loc);
          map.setZoom(13);
        });
      }
    } else if (provId === 'all') {
      map.panTo({ lat: -29.0, lng: 25.0 });
      map.setZoom(6);
    } else {
      const prov = SA_PROVINCES.find(p => p.id === provId);
      if (prov) {
        map.panTo(prov.center);
        map.setZoom(10);
      }
    }
  };

  const handleInputChange = useCallback(
    async (text: string) => {
      setSearchQuery(text);
      if (!text.trim() || !placesLib) {
        setSuggestions([]);
        return;
      }

      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }

        const center = map?.getCenter();
        const request: google.maps.places.AutocompleteRequest = {
          input: text,
          sessionToken: sessionTokenRef.current,
          ...(center && {
            locationBias: {
              center: { lat: center.lat(), lng: center.lng() },
              radius: 40000
            }
          })
        };

        const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        setSuggestions(res.suggestions || []);
      } catch (err: any) {
        if (String(err?.message || err).includes('429') || String(err?.message || err).includes('RESOURCE_EXHAUSTED')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    },
    [placesLib, map]
  );

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;

    setIsSearching(true);
    setSuggestions([]);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'priceLevel']
      });

      if (place.location && map) {
        const spotLoc = { lat: place.location.lat(), lng: place.location.lng() };
        const dist = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, spotLoc.lat, spotLoc.lng) : undefined;
        const newSpot: PlaceSpot = {
          id: place.id || `spot-${Date.now()}`,
          placeId: place.id,
          name: place.displayName || suggestion.placePrediction.text.text,
          address: place.formattedAddress || '',
          location: spotLoc,
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          priceLevel: normalizePriceTier(place.priceLevel as string),
          category: 'Live Places Result',
          distanceKm: dist,
        };

        setSpots(prev => [newSpot, ...prev.filter(s => s.id !== newSpot.id)]);
        setSelectedSpot(newSpot);
        map.panTo(newSpot.location);
        map.setZoom(15);
      }
    } catch {
      setMapError('Could not retrieve place details. Try another venue.');
    } finally {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleSelectCategoryFilter = (catId: PlaceCategoryFilter) => {
    hapticLight();
    setSelectedPlaceCategory(catId);
    setIsFilterMenuOpen(false);
  };

  const handleSearchPlacesForCategory = async (catOption: PlaceCategoryOption) => {
    setSelectedPlaceCategory(catOption.id);
    setIsFilterMenuOpen(false);
    if (!placesLib) return;

    setIsSearching(true);
    try {
      const center = map?.getCenter() || DEFAULT_CENTER;
      const lat = typeof center.lat === 'function' ? center.lat() : center.lat;
      const lng = typeof center.lng === 'function' ? center.lng() : center.lng;

      const request = {
        textQuery: `${catOption.placesQuery} South Africa`,
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'priceLevel'],
        locationBias: { center: { lat, lng }, radius: 30000 },
        maxResultCount: 12
      };

      const { places } = await placesLib.Place.searchByText(request);
      if (places && places.length > 0) {
        const newSpots: PlaceSpot[] = places.map((p, idx) => {
          const loc = {
            lat: p.location?.lat() || (lat + (Math.random() - 0.5) * 0.05),
            lng: p.location?.lng() || (lng + (Math.random() - 0.5) * 0.05)
          };
          const dist = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng) : undefined;
          return {
            id: p.id || `${catOption.id.toLowerCase()}-${idx}-${Date.now()}`,
            placeId: p.id,
            name: p.displayName || `${catOption.shortLabel} Spot`,
            address: p.formattedAddress || 'South Africa',
            location: loc,
            rating: p.rating,
            userRatingCount: p.userRatingCount,
            priceLevel: normalizePriceTier(p.priceLevel as string),
            category: catOption.shortLabel,
            mood: catOption.id === 'all' ? 'Romantic' : (catOption.id as DateMood),
            distanceKm: dist,
          };
        });
        setSpots(prev => {
          const existingIds = new Set(newSpots.map(n => n.id));
          return [...newSpots, ...prev.filter(s => !existingIds.has(s.id))];
        });
        hapticSuccess();
      }
    } catch (err: any) {
      if (String(err?.message || err).includes('429') || String(err?.message || err).includes('RESOURCE_EXHAUSTED')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleNearMe = () => {
    if (userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(13);
      setActiveProvinceId('near-me');
      hapticSuccess();
    } else if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.panTo(loc);
          map.setZoom(13);
          setActiveProvinceId('near-me');
          hapticSuccess();
        },
        () => {
          setMapError('Location permission not granted. Use the province buttons above to explore any region.');
        }
      );
    }
  };

  const activeCategoryOption = PLACE_CATEGORY_OPTIONS.find(o => o.id === selectedPlaceCategory) || PLACE_CATEGORY_OPTIONS[0];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-outline-variant/15 shadow-md flex flex-col bg-surface-container">
      {/* AI Natural-Language Map Builder Header ("Describe your idea, Gemini does the rest") */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-primary/10 via-surface-container to-secondary/10 border-b border-outline-variant/15 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary text-on-primary-fixed shadow-xs shrink-0">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-on-surface flex items-center gap-1.5">
                <span>Gemini AI Date Map Architect</span>
                <span className="text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/15 text-primary font-bold">
                  Places · Weather · Routes · 3D
                </span>
              </h3>
              <p className="text-[11px] text-outline">
                Describe your ideal date night — Gemini plots real venues, live weather, and turn-by-turn routes.
              </p>
            </div>
          </div>

          {routeStops.length > 0 && (
            <button
              type="button"
              onClick={() => setIsRouteDrawerOpen(prev => !prev)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer tabular-nums"
            >
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Date Route ({routeStops.length} stops)</span>
              {computedRoute && (
                <span>· {computedRoute.totalDistanceKm} km · {computedRoute.totalDurationMinutes} min</span>
              )}
            </button>
          )}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleBuildAiMapItinerary();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g., Sunset wine tasting, botanical walk & candlelit Italian dinner..."
              className="w-full bg-surface-container-highest/90 border border-outline-variant/30 focus:border-primary rounded-xl pl-10 pr-8 py-2.5 text-xs text-on-surface outline-none transition-colors min-h-[40px]"
            />
            {aiPrompt && (
              <button
                type="button"
                onClick={() => setAiPrompt('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
                aria-label="Clear prompt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isAiBuildingMap || !aiPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer shrink-0 min-h-[40px]"
          >
            {isAiBuildingMap ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Building Map...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Build Date Map</span>
              </>
            )}
          </button>
        </form>

        {/* Quick AI Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline shrink-0">Try:</span>
          {AI_MAP_PROMPT_IDEAS.map(idea => (
            <button
              key={idea}
              type="button"
              onClick={() => handleBuildAiMapItinerary(idea)}
              disabled={isAiBuildingMap}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary text-outline border border-outline-variant/20 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {idea}
            </button>
          ))}
        </div>

        {/* Active AI Itinerary Summary Banner */}
        <AnimatePresence>
          {activeAiItinerary && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-2xl bg-surface-container-highest border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-serif font-bold text-primary">
                    {activeAiItinerary.itineraryTitle}
                  </span>
                  <span className="text-[11px] text-outline tabular-nums">
                    {activeAiItinerary.mood} · {routeStops.length} Stops · Est. {formatRand(activeAiItinerary.estimatedTotalRand)}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface/80 line-clamp-2">
                  {activeAiItinerary.summary}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onFundDateGoal && (
                  <button
                    type="button"
                    onClick={() =>
                      onFundDateGoal({
                        name: activeAiItinerary.itineraryTitle,
                        targetAmount: activeAiItinerary.estimatedTotalRand
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-secondary/15 text-secondary hover:bg-secondary/25 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums"
                  >
                    <PiggyBank className="w-3.5 h-3.5" />
                    <span>Fund Goal ({formatRand(activeAiItinerary.estimatedTotalRand)})</span>
                  </button>
                )}
                {onPlanDate && (
                  <button
                    type="button"
                    onClick={() =>
                      onPlanDate({
                        title: activeAiItinerary.itineraryTitle,
                        location: routeStops.map(s => s.name).join(' → '),
                        description: `${activeAiItinerary.summary}\n\nRoute Stops:\n${routeStops
                          .map((s, i) => `${i + 1}. ${s.name} (${s.address})`)
                          .join('\n')}`,
                        mood: (activeAiItinerary.mood as DateMood) || 'Romantic'
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Plan Itinerary</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveAiItinerary(null)}
                  className="p-1 text-outline hover:text-on-surface"
                  aria-label="Dismiss AI itinerary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Standard Search, Category Filter & Province Controls Bar */}
      <div className="p-3 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/15 z-20 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Autocomplete Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search live Google Places venues, suburbs, or cities across SA..."
              value={searchQuery}
              onChange={e => handleInputChange(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl pl-9 pr-9 py-2 text-xs text-on-surface outline-none focus:border-primary min-h-[40px]"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-highest border border-outline-variant/30 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-surface-container-high transition-colors text-xs text-on-surface border-b border-outline-variant/10 last:border-b-0 flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">{s.placePrediction?.mainText.text}</strong>
                      <span className="text-[11px] text-outline">{s.placePrediction?.secondaryText?.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map vs List View Toggle */}
          <div className="bg-surface-container-high p-0.5 rounded-xl border border-outline-variant/20 flex gap-0.5 shrink-0">
            <button
              onClick={() => { hapticLight(); setViewMode('map'); }}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all min-h-[38px] ${
                viewMode === 'map' ? 'bg-primary text-on-primary-fixed shadow-xs' : 'text-outline hover:text-on-surface'
              }`}
              title="Map View"
              aria-label="Map View"
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => { hapticLight(); setViewMode('list'); }}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all min-h-[38px] ${
                viewMode === 'list' ? 'bg-primary text-on-primary-fixed shadow-xs' : 'text-outline hover:text-on-surface'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline tabular-nums">List ({spots.length})</span>
            </button>
          </div>
        </div>

        {/* Place Category Filter Menu & Segmented Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {/* Dropdown Filter Menu Button */}
          <div className="relative shrink-0" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setIsFilterMenuOpen(!isFilterMenuOpen);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[36px] ${
                selectedPlaceCategory !== 'all'
                  ? `${activeCategoryOption.colorClass} border-transparent shadow-xs`
                  : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-primary/40'
              }`}
              aria-expanded={isFilterMenuOpen}
              aria-haspopup="true"
              title="Toggle Place Category Menu"
            >
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span className="flex items-center gap-1">
                <span>{activeCategoryOption.emoji}</span>
                <span className="font-bold">{activeCategoryOption.shortLabel}</span>
              </span>
              <span className="text-[10px] opacity-80 font-bold px-1 py-0.2 rounded-full bg-black/10 dark:bg-white/10 tabular-nums">
                {categoryCounts[selectedPlaceCategory]}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Filter Menu Dropdown Popover */}
            <AnimatePresence>
              {isFilterMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-surface-container-highest border border-outline-variant/30 rounded-2xl shadow-2xl z-40 p-2 space-y-1 backdrop-blur-xl"
                >
                  <div className="px-2.5 py-1.5 border-b border-outline-variant/15 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                      Filter Date Categories
                    </span>
                    <span className="text-[10px] text-outline tabular-nums">
                      {categoryCounts.all} places total
                    </span>
                  </div>

                  <div className="space-y-1 pt-1">
                    {PLACE_CATEGORY_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = selectedPlaceCategory === opt.id;
                      const count = categoryCounts[opt.id];
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectCategoryFilter(opt.id)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-surface-container-high border border-primary/30 shadow-xs'
                              : 'hover:bg-surface-container-high/60 border border-transparent'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${opt.colorClass} shadow-xs`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-on-surface flex items-center gap-1">
                                <span>{opt.emoji}</span>
                                <span>{opt.label}</span>
                              </span>
                              <span className="text-[11px] font-bold text-outline shrink-0 bg-surface-container px-1.5 py-0.5 rounded-md tabular-nums">
                                {count}
                              </span>
                            </div>
                            <p className="text-[11px] text-outline mt-0.5 leading-snug line-clamp-2">
                              {opt.description}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Action to Search Google Places API */}
                  <div className="pt-2 mt-1 border-t border-outline-variant/15">
                    <button
                      type="button"
                      onClick={() => handleSearchPlacesForCategory(activeCategoryOption)}
                      className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search live {activeCategoryOption.shortLabel} spots with Places API</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Segmented Category Toggle Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {PLACE_CATEGORY_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = selectedPlaceCategory === opt.id;
              const count = categoryCounts[opt.id];
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectCategoryFilter(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer min-h-[36px] ${
                    isSelected
                      ? opt.activePillClass
                      : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                  title={opt.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.shortLabel}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                    isSelected ? 'bg-black/15 dark:bg-white/20 text-inherit' : 'bg-surface-container text-outline'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* South African Province Navigation Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar items-center">
          <span className="text-[10px] uppercase font-bold text-outline shrink-0 tracking-wider">
            Province:
          </span>

          <button
            onClick={() => handleSelectProvince('near-me')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer min-h-[32px] ${
              activeProvinceId === 'near-me'
                ? 'bg-primary text-on-primary-fixed border-primary shadow-xs'
                : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'
            }`}
          >
            <Navigation className="w-3 h-3 text-current" />
            <span>Near Me</span>
          </button>

          <button
            onClick={() => handleSelectProvince('all')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer min-h-[32px] ${
              activeProvinceId === 'all'
                ? 'bg-primary text-on-primary-fixed border-primary shadow-xs'
                : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'
            }`}
          >
            <span>All SA</span>
          </button>

          {SA_PROVINCES.map(prov => {
            const isSelected = activeProvinceId === prov.id;
            return (
              <button
                key={prov.id}
                onClick={() => handleSelectProvince(prov.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer min-h-[32px] ${
                  isSelected
                    ? 'bg-primary text-on-primary-fixed border-primary shadow-xs'
                    : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'
                }`}
                title={prov.tagline}
              >
                <span>{prov.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Count, Map Layers & 3D Camera Controls Bar */}
      <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between text-xs text-outline flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-on-surface tabular-nums">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>
              Showing <strong>{spots.length}</strong>{' '}
              {selectedPlaceCategory === 'all' ? (
                'date destinations'
              ) : (
                <span className="font-semibold text-primary">{selectedPlaceCategory} places</span>
              )}
            </span>
            {activeProvinceId === 'near-me' && nearestProvince && (
              <span className="text-primary font-semibold">near {nearestProvince.name}</span>
            )}
            {activeProvinceId !== 'all' && activeProvinceId !== 'near-me' && (
              <span className="text-outline">in {SA_PROVINCES.find(p => p.id === activeProvinceId)?.name}</span>
            )}
          </span>

          {selectedPlaceCategory !== 'all' && (
            <button
              onClick={() => setSelectedPlaceCategory('all')}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold bg-primary/10 px-2 py-0.5 rounded-full"
              title="Reset Category Filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filter</span>
            </button>
          )}
        </div>

        {/* 3D Buildings, Aerial Satellite & Traffic Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={handleToggle3DBuildings}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
              is3DMode
                ? 'bg-primary text-on-primary-fixed border-primary'
                : 'bg-surface-container-high text-on-surface border-outline-variant/20 hover:border-primary/40'
            }`}
            title="Toggle 3D Buildings & 60° Camera Tilt"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3D Buildings</span>
          </button>

          {is3DMode && (
            <button
              type="button"
              onClick={handleRotateCamera}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-surface-container-high text-on-surface border border-outline-variant/20 hover:border-primary/40 cursor-pointer"
              title="Rotate 3D Camera Heading +45°"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Orbit 45°</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSatellite}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
              mapTypeId === 'hybrid'
                ? 'bg-primary text-on-primary-fixed border-primary'
                : 'bg-surface-container-high text-on-surface border-outline-variant/20 hover:border-primary/40'
            }`}
            title="Toggle Satellite & Aerial Hybrid Imagery"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Aerial</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              setIsTrafficEnabled(prev => !prev);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
              isTrafficEnabled
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-surface-container-high text-on-surface border-outline-variant/20 hover:border-primary/40'
            }`}
            title="Toggle Live Traffic Conditions Layer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Traffic</span>
          </button>

          {isSearching && (
            <span className="flex items-center gap-1 text-primary font-medium ml-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Searching...</span>
            </span>
          )}
        </div>
      </div>

      {mapError && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
          <span>{mapError}</span>
          <button onClick={() => setMapError(null)} className="p-0.5 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Surface: Map Canvas + Floating Route Builder */}
      <div className="relative h-[520px] sm:h-[600px] w-full overflow-hidden">
        {viewMode === 'map' ? (
          <>
            <Map
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={6}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              {/* User Location Pulse Marker */}
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Your Location">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-primary opacity-75"></span>
                    <div className="relative h-6 w-6 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-lg">
                      <Heart className="w-3 h-3 text-on-primary fill-current" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Venue Markers with Route Stop Numbers & Category Badges */}
              {spots.map(spot => {
                const catOption = getSpotCategoryOption(spot);
                const Icon = catOption.icon;
                const isSelected = selectedSpot?.id === spot.id;
                const routeIdx = routeStops.findIndex(r => r.id === spot.id);
                const isInRoute = routeIdx !== -1;

                return (
                  <AdvancedMarker
                    key={spot.id}
                    position={spot.location}
                    title={`${spot.name} (${catOption.shortLabel})`}
                    onClick={() => {
                      hapticLight();
                      setSelectedSpot(spot);
                    }}
                  >
                    <div
                      className={`relative p-2 rounded-xl shadow-md border cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary text-white border-white ring-4 ring-primary/40 scale-115 shadow-lg z-30'
                          : isInRoute
                          ? 'bg-rose-600 text-white border-white ring-2 ring-rose-400 scale-110 shadow-md z-20'
                          : `${catOption.colorClass} border-white/60 hover:brightness-110 shadow-sm`
                      }`}
                      title={`${spot.name} · ${catOption.shortLabel}`}
                    >
                      <Icon className="w-4 h-4" />
                      {isInRoute && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center border border-white shadow-xs tabular-nums">
                          {routeIdx + 1}
                        </span>
                      )}
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>

            {/* Floating Bottom-Left Near Me & Route Builder Buttons */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
              <button
                onClick={handleNearMe}
                title="Find Near Me"
                className="px-3.5 py-2.5 bg-surface-container/95 hover:bg-surface-container text-primary rounded-2xl shadow-lg border border-outline-variant/30 backdrop-blur-md cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <Compass className="w-4 h-4" />
                <span>Near Me</span>
              </button>

              <button
                onClick={() => {
                  hapticLight();
                  if (routeStops.length === 0 && spots.length >= 2) {
                    setRouteStops(spots.slice(0, 3));
                  }
                  setIsRouteDrawerOpen(prev => !prev);
                }}
                className="px-3.5 py-2.5 bg-surface-container/95 hover:bg-surface-container text-on-surface rounded-2xl shadow-lg border border-outline-variant/30 backdrop-blur-md cursor-pointer flex items-center gap-1.5 text-xs font-bold tabular-nums"
              >
                <RouteIcon className="w-4 h-4 text-rose-500" />
                <span>
                  {routeStops.length > 0
                    ? `Route (${routeStops.length} stops)`
                    : 'Build Multi-Stop Route'}
                </span>
              </button>
            </div>

            {/* Floating Multi-Stop Turn-by-Turn Route Panel */}
            <AnimatePresence>
              {isRouteDrawerOpen && routeStops.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 max-w-[calc(100%-1.5rem)] bg-surface-container/95 backdrop-blur-xl rounded-2xl border border-outline-variant/30 shadow-2xl z-30 flex flex-col overflow-hidden"
                >
                  <div className="p-3.5 border-b border-outline-variant/15 flex items-center justify-between gap-2 bg-surface-container-high/60">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500">
                        <RouteIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-on-surface">
                          Date Night Route Builder
                        </h4>
                        <p className="text-[11px] text-outline tabular-nums">
                          {routeStops.length} stops ·{' '}
                          {isComputingRoute
                            ? 'Calculating route...'
                            : computedRoute
                            ? `${computedRoute.totalDistanceKm} km · ${computedRoute.totalDurationMinutes} min`
                            : 'Add at least 2 stops'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Driving vs Walking Switcher */}
                      <button
                        type="button"
                        onClick={() => setTravelMode('DRIVING')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                          travelMode === 'DRIVING'
                            ? 'bg-primary text-on-primary-fixed'
                            : 'text-outline hover:text-on-surface'
                        }`}
                        title="Driving Route"
                      >
                        <Car className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTravelMode('WALKING')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                          travelMode === 'WALKING'
                            ? 'bg-primary text-on-primary-fixed'
                            : 'text-outline hover:text-on-surface'
                        }`}
                        title="Walking Route"
                      >
                        <Footprints className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRouteDrawerOpen(false)}
                        className="p-1.5 text-outline hover:text-on-surface cursor-pointer"
                        aria-label="Close route builder"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stops & Turn-by-Turn Legs */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {routeStops.map((stop, idx) => {
                      const legAfter = computedRoute?.legs[idx];
                      const estCost = estimateSpotCostRand(stop);
                      return (
                        <div key={stop.id} className="space-y-2">
                          <div
                            onClick={() => {
                              setSelectedSpot(stop);
                              map?.panTo(stop.location);
                            }}
                            className="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 flex items-start justify-between gap-2 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-on-surface truncate">
                                  {stop.name}
                                </p>
                                <p className="text-[11px] text-outline truncate">
                                  {stop.address}
                                </p>
                                <p className="text-[11px] text-primary font-semibold mt-0.5 tabular-nums">
                                  Est. {formatRand(estCost)}
                                  {stop.stayDurationMinutes ? ` · ${stop.stayDurationMinutes} min stay` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleToggleRouteStop(stop);
                              }}
                              className="p-1 text-outline hover:text-rose-500 shrink-0"
                              title="Remove stop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {legAfter && (
                            <div className="pl-6 flex items-center gap-2 text-[11px] text-outline tabular-nums">
                              <div className="w-0.5 h-4 bg-rose-500/40 rounded-full" />
                              <span>
                                {travelMode === 'WALKING' ? 'Walk' : 'Drive'} {legAfter.distanceKm} km · {legAfter.durationMinutes} min
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Route Summary Footer & Goal / Planner Actions */}
                  <div className="p-3 border-t border-outline-variant/15 bg-surface-container-high/80 space-y-2">
                    {computedRoute && (
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="text-outline">
                          Total: <strong>{computedRoute.totalDistanceKm} km</strong> ·{' '}
                          <strong>{computedRoute.totalDurationMinutes} min</strong> travel
                        </span>
                        <span className="font-bold text-primary">
                          Est. {formatRand(computedRoute.totalEstimatedCostRand)}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {onFundDateGoal && (
                        <button
                          type="button"
                          onClick={() => {
                            const totalRand =
                              computedRoute?.totalEstimatedCostRand ||
                              routeStops.reduce((s, x) => s + estimateSpotCostRand(x), 0);
                            onFundDateGoal({
                              name:
                                activeAiItinerary?.itineraryTitle ||
                                `${routeStops[0].name} Date Route`,
                              targetAmount: totalRand
                            });
                          }}
                          className="py-2 px-3 rounded-xl bg-secondary/15 text-secondary hover:bg-secondary/25 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer tabular-nums"
                        >
                          <PiggyBank className="w-3.5 h-3.5" />
                          <span>Fund Date Goal</span>
                        </button>
                      )}
                      {onPlanDate && (
                        <button
                          type="button"
                          onClick={() => {
                            onPlanDate({
                              title:
                                activeAiItinerary?.itineraryTitle ||
                                `${routeStops[0].name} & ${routeStops[routeStops.length - 1].name} Date`,
                              location: routeStops.map(s => s.name).join(' → '),
                              description: `Multi-stop date route (${
                                computedRoute ? `${computedRoute.totalDistanceKm} km, ${computedRoute.totalDurationMinutes} mins travel` : ''
                              }):\n${routeStops
                                .map((s, i) => `${i + 1}. ${s.name} — ${s.address}`)
                                .join('\n')}`,
                              mood: routeStops[0]?.mood || 'Romantic'
                            });
                          }}
                          className="py-2 px-3 rounded-xl bg-primary text-on-primary-fixed text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Plan Route</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* List View */
          <div className="w-full h-full overflow-y-auto p-4 space-y-3 bg-surface-container-low">
            {spots.length === 0 ? (
              <div className="text-center py-12 px-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/20 space-y-3 my-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Filter className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-bold text-on-surface">
                  No {selectedPlaceCategory} spots found
                </h4>
                <p className="text-xs text-outline max-w-sm mx-auto">
                  We couldn't find any places matching "{selectedPlaceCategory}" in {currentProvinceName}. Try selecting "All Places" or exploring other provinces.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedPlaceCategory('all')}>
                    View All Categories
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleSelectProvince('all')}>
                    Explore All SA
                  </Button>
                </div>
              </div>
            ) : (
              spots.map(spot => {
                const catOption = getSpotCategoryOption(spot);
                const CatIcon = catOption.icon;
                const isInRoute = routeStops.some(r => r.id === spot.id);
                const estCost = estimateSpotCostRand(spot);

                return (
                  <Card
                    key={spot.id}
                    variant="high"
                    padding="md"
                    className="hover:border-primary/40 cursor-pointer transition-all"
                    onClick={() => setSelectedSpot(spot)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap tabular-nums">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${catOption.badgeBg} ${catOption.badgeText}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{catOption.shortLabel}</span>
                          </span>
                          <span className="text-[11px] text-outline">
                            {spot.category || 'Date Venue'}
                            {spot.distanceKm !== undefined ? ` · ${spot.distanceKm} km away` : ''}
                            {` · Est. ${formatRand(estCost)}`}
                          </span>
                          {spot.mood && (
                            <MoodBadge mood={spot.mood} size="sm" variant="compact" />
                          )}
                        </div>
                        <h3 className="font-serif text-lg font-bold text-on-surface truncate">{spot.name}</h3>
                        <p className="text-xs text-outline flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {spot.address}
                        </p>
                      </div>

                      {spot.rating && (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0 tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{spot.rating}</span>
                        </div>
                      )}
                    </div>

                    {spot.summary && (
                      <p className="text-xs text-on-surface/80 mt-2 leading-relaxed">
                        {spot.summary}
                      </p>
                    )}

                    <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between gap-2 mt-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleRouteStop(spot);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border cursor-pointer ${
                            isInRoute
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-surface-container text-on-surface border-outline-variant/30 hover:border-primary'
                          }`}
                        >
                          <RouteIcon className="w-3.5 h-3.5" />
                          <span>{isInRoute ? 'In Route' : '+ Add to Route'}</span>
                        </button>

                        {onFundDateGoal && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onFundDateGoal({
                                name: `${spot.name} Date Fund`,
                                targetAmount: estCost
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 bg-secondary/15 text-secondary hover:bg-secondary/25 cursor-pointer tabular-nums"
                          >
                            <PiggyBank className="w-3.5 h-3.5" />
                            <span>Fund ({formatRand(estCost)})</span>
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {onAddToBucketList && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              onAddToBucketList({ title: spot.name, category: spot.category || 'Romantic Dinners', notes: spot.address });
                            }}
                          >
                            Wishlist
                          </Button>
                        )}
                        {onPlanDate && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              onPlanDate({
                                title: spot.name,
                                location: spot.address,
                                description: spot.summary,
                                mood: spot.mood,
                              });
                            }}
                          >
                            Plan Date
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Venue Inspector Modal / Bottom Sheet with Weather, Street View, 3D & Goal Linking */}
      <BottomSheet
        isOpen={Boolean(selectedSpot)}
        onClose={() => setSelectedSpot(null)}
        title={selectedSpot?.name}
      >
        {selectedSpot && (
          <div className="space-y-4">
            {/* Metadata Line (Zero-Pill Discipline with · Separators & Tabular Nums) */}
            <div className="flex items-center gap-2 text-xs flex-wrap tabular-nums">
              <span className="font-semibold text-secondary px-2.5 py-0.5 rounded-md bg-secondary/10">
                {selectedSpot.category || 'Romantic Spot'}
              </span>
              {selectedSpot.mood && (
                <MoodBadge mood={selectedSpot.mood} size="sm" />
              )}
              <span className="text-outline font-medium">
                {selectedSpot.rating ? `★ ${selectedSpot.rating} (${selectedSpot.userRatingCount?.toLocaleString() || '120+'} reviews)` : 'Curated Spot'}
                {selectedSpot.priceLevel ? ` · ${normalizePriceTier(selectedSpot.priceLevel)}` : ''}
                {` · Est. ${formatRand(estimateSpotCostRand(selectedSpot))}`}
                {selectedSpot.distanceKm !== undefined ? ` · ${selectedSpot.distanceKm} km away` : ''}
              </span>
            </div>

            <p className="text-xs text-outline flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{selectedSpot.address}</span>
            </p>

            {/* Live Weather & Sunset Golden Hour Strip */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-surface-container-high to-rose-500/10 border border-outline-variant/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-on-surface tabular-nums">
                    {isLoadingWeather ? (
                      'Checking live venue weather & sunset...'
                    ) : spotWeather ? (
                      `${spotWeather.temperatureC}°C · ${spotWeather.condition}`
                    ) : (
                      '22°C · Clear & Pleasant'
                    )}
                  </span>
                </div>

                {spotWeather && (
                  <div className="flex items-center gap-3 text-[11px] text-outline font-medium tabular-nums">
                    <span className="flex items-center gap-1" title="Golden Hour & Local Sunset Time (SAST)">
                      <Sunset className="w-3.5 h-3.5 text-rose-500" />
                      <span>Golden Hour {spotWeather.goldenHourTime} · Sunset {spotWeather.sunsetTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      <span>{spotWeather.windKmh} km/h</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-500" />
                      <span>{spotWeather.precipProb}% rain</span>
                    </span>
                  </div>
                )}
              </div>
              {spotWeather?.dateSuitabilityNote && (
                <p className="text-[11px] text-on-surface/80 leading-snug">
                  {spotWeather.dateSuitabilityNote}
                </p>
              )}
            </div>

            {/* Venue Inspector View Tabs: Overview | 360° Street View | Reviews & Photos */}
            <div className="flex items-center gap-1.5 border-b border-outline-variant/15 pb-2">
              <button
                type="button"
                onClick={() => setInspectorTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  inspectorTab === 'overview'
                    ? 'bg-primary text-on-primary-fixed'
                    : 'bg-surface-container-high text-outline hover:text-on-surface'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Venue Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab('streetview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  inspectorTab === 'streetview'
                    ? 'bg-primary text-on-primary-fixed'
                    : 'bg-surface-container-high text-outline hover:text-on-surface'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>360° Street View</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab('reviews')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  inspectorTab === 'reviews'
                    ? 'bg-primary text-on-primary-fixed'
                    : 'bg-surface-container-high text-outline hover:text-on-surface'
                }`}
              >
                <MessageSquareQuote className="w-3.5 h-3.5" />
                <span>Photos & Reviews</span>
              </button>
            </div>

            {/* Tab 1: Overview */}
            {inspectorTab === 'overview' && (
              <div className="space-y-3">
                {selectedSpot.photos && selectedSpot.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedSpot.photos.slice(0, 3).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`${selectedSpot.name} preview ${idx + 1}`}
                        className="w-full h-28 object-cover rounded-xl border border-outline-variant/15"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                {selectedSpot.summary && (
                  <p className="text-xs text-on-surface/90 leading-relaxed bg-surface-container-high/50 p-3 rounded-xl border border-outline-variant/10">
                    {selectedSpot.summary}
                  </p>
                )}

                {selectedSpot.insiderTip && selectedSpot.insiderTip !== selectedSpot.summary && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-on-surface flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-primary">Date Concierge Tip: </strong>
                      <span>{selectedSpot.insiderTip}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Interactive 360° Street View */}
            {inspectorTab === 'streetview' && (
              <VenueStreetViewPanel
                location={selectedSpot.location}
                venueName={selectedSpot.name}
                onSwitchTo3DAerial={() => {
                  const targetLoc = selectedSpot.location;
                  setSelectedSpot(null);
                  setViewMode('map');
                  setIs3DMode(true);
                  setMapTypeId('hybrid');
                  if (map) {
                    map.panTo(targetLoc);
                    map.setMapTypeId('hybrid');
                    map.setZoom(18);
                    map.setTilt(60);
                    map.setHeading(45);
                  }
                }}
              />
            )}

            {/* Tab 3: Live Places Photos & Reviews */}
            {inspectorTab === 'reviews' && (
              <div className="space-y-3">
                {isEnrichingPlace && (
                  <div className="flex items-center gap-2 text-xs text-outline py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Fetching live Google Places photos and guest reviews...</span>
                  </div>
                )}

                {selectedSpot.photos && selectedSpot.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSpot.photos.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`${selectedSpot.name} photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-outline-variant/20"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                {selectedSpot.reviews && selectedSpot.reviews.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSpot.reviews.map((rev, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/15 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-on-surface">{rev.authorName}</strong>
                          <span className="text-amber-500 font-bold tabular-nums">
                            {'★'.repeat(Math.round(rev.rating))} {rev.relativeTime ? `· ${rev.relativeTime}` : ''}
                          </span>
                        </div>
                        <p className="text-xs text-outline leading-relaxed line-clamp-3">
                          "{rev.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isEnrichingPlace && (
                    <p className="text-xs text-outline py-2">
                      Highly rated by couples ({selectedSpot.rating || 4.8} ★) for atmosphere, service, and romantic setting.
                    </p>
                  )
                )}
              </div>
            )}

            {/* Primary Action Buttons: Plan Date | Fund Goal | Add to Route | Wishlist | Directions */}
            <div className="pt-2 flex flex-wrap gap-2">
              {onPlanDate && (
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 min-w-[150px]"
                  icon={<Calendar className="w-4 h-4" />}
                  onClick={() => {
                    onPlanDate({
                      title: selectedSpot.name,
                      location: selectedSpot.address,
                      description: selectedSpot.summary || 'Romantic outing together.',
                      mood: selectedSpot.mood,
                    });
                    setSelectedSpot(null);
                  }}
                >
                  Plan Date Night
                </Button>
              )}

              {onFundDateGoal && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<PiggyBank className="w-4 h-4" />}
                  onClick={() => {
                    const estRand = estimateSpotCostRand(selectedSpot);
                    onFundDateGoal({
                      name: `${selectedSpot.name} Date Fund`,
                      targetAmount: estRand
                    });
                    setSelectedSpot(null);
                  }}
                >
                  Fund This Date ({formatRand(estimateSpotCostRand(selectedSpot))})
                </Button>
              )}

              {onShareSpotToChat && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<MessageCircleHeart className="w-4 h-4 text-primary" />}
                  onClick={() => {
                    onShareSpotToChat({
                      id: selectedSpot.id,
                      name: selectedSpot.name,
                      category: selectedSpot.category || 'Date Venue',
                      location: selectedSpot.address,
                      estimatedBudget: estimateSpotCostRand(selectedSpot),
                      rating: selectedSpot.rating,
                      photoUrl: selectedSpot.photos?.[0],
                      summary: selectedSpot.summary,
                      mood: selectedSpot.mood,
                      lat: selectedSpot.location.lat,
                      lng: selectedSpot.location.lng
                    });
                    setSelectedSpot(null);
                  }}
                >
                  Share to Chat
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                icon={<RouteIcon className="w-4 h-4" />}
                onClick={() => {
                  handleToggleRouteStop(selectedSpot);
                  setSelectedSpot(null);
                }}
              >
                {routeStops.some(r => r.id === selectedSpot.id) ? 'Remove from Route' : '+ Add to Route'}
              </Button>

              {onAddToBucketList && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<Bookmark className="w-4 h-4" />}
                  onClick={() => {
                    onAddToBucketList({
                      title: selectedSpot.name,
                      category: selectedSpot.category || 'Romantic Dinners',
                      notes: selectedSpot.address
                    });
                    setSelectedSpot(null);
                  }}
                >
                  Wishlist
                </Button>
              )}

              <a
                href={
                  selectedSpot.googleMapsURI ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedSpot.name} ${selectedSpot.address}`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default function GoogleDateMap(props: GoogleDateMapProps) {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyDZsBhSTppoy_W69liV_F60NQJMDBcOHeo';

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'routes', 'streetView']}>
      <MapContent {...props} />
    </APIProvider>
  );
}
