/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
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
  AlertCircle,
  Filter,
  ChevronDown,
  Check,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Event, DateMood } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MoodBadge } from '../ui/MoodBadge';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { 
  SA_PROVINCES, 
  ALL_PROVINCES_DATE_SPOTS, 
  calculateDistanceKm, 
  getNearestProvince,
  SAProvince,
  CuratedDateSpot 
} from '../../utils/provinces';

// Default initial center (South Africa)
const DEFAULT_CENTER = { lat: -29.0, lng: 25.0 }; // South Africa national center

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

export interface PlaceSpot {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  category?: string;
  summary?: string;
  provinceId?: string;
  mood?: DateMood;
  distanceKm?: number;
}

interface GoogleDateMapProps {
  events?: Event[];
  onPlanDate?: (dateInfo: { title: string; location: string; description?: string; mood?: DateMood }) => void;
  onAddToBucketList?: (item: { title: string; category: string; notes?: string }) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const CATEGORIES = [
  { id: 'romantic-dining', label: 'Fine Dining', icon: Wine, query: 'romantic fine dining restaurant' },
  { id: 'cozy-cafes', label: 'Cozy Cafés', icon: Coffee, query: 'cozy aesthetic cafe couple' },
  { id: 'scenic-views', label: 'Scenic & Sunset', icon: TreePine, query: 'scenic viewpoint sunset romantic park' },
  { id: 'cocktail-bars', label: 'Rooftops & Cocktails', icon: Utensils, query: 'romantic rooftop cocktail lounge bar' },
  { id: 'date-activities', label: 'Fun Activities', icon: Sparkles, query: 'couple activities romantic pottery cinema museum' },
];

function MapContent({
  events = [],
  onPlanDate,
  onAddToBucketList,
  userLocation
}: GoogleDateMapProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Place category filter: 'all' | 'Romantic' | 'Adventurous' | 'Cozy'
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState<PlaceCategoryFilter>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Province selector: 'near-me' (if GPS available), 'all', or province id ('wc', 'gp', 'kzn', etc.)
  const [activeProvinceId, setActiveProvinceId] = useState<string>(userLocation ? 'near-me' : 'all');

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
  const [selectedSpot, setSelectedSpot] = useState<PlaceSpot | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Compute nearest province
  const nearestProvince = useMemo(() => {
    if (!userLocation) return null;
    return getNearestProvince(userLocation.lat, userLocation.lng);
  }, [userLocation]);

  // Dynamic counts for each category in the current province scope
  const categoryCounts = useMemo(() => {
    let provSpots = [...initialSpots];
    if (activeProvinceId === 'near-me' && nearestProvince) {
      provSpots = provSpots.filter(s => s.provinceId === nearestProvince.id);
    } else if (activeProvinceId !== 'all' && activeProvinceId !== 'near-me') {
      provSpots = provSpots.filter(s => s.provinceId === activeProvinceId);
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

  // Initial center on user location or nearest province if available
  useEffect(() => {
    if (map) {
      if (userLocation) {
        map.panTo(userLocation);
        map.setZoom(12);
      } else {
        // Center on Cape Town / Johannesburg romantic hub
        map.panTo({ lat: -28.4793, lng: 24.6727 });
        map.setZoom(6);
      }
    }
  }, [userLocation, map]);

  // Filter spots whenever activeProvinceId or selectedPlaceCategory changes
  useEffect(() => {
    let filtered = [...initialSpots];
    if (activeProvinceId === 'near-me' && nearestProvince) {
      filtered = filtered.filter(s => s.provinceId === nearestProvince.id);
    } else if (activeProvinceId !== 'all' && activeProvinceId !== 'near-me') {
      filtered = filtered.filter(s => s.provinceId === activeProvinceId);
    }

    // Filter by selectedPlaceCategory
    if (selectedPlaceCategory !== 'all') {
      filtered = filtered.filter(s => spotMatchesCategory(s, selectedPlaceCategory));
    }

    // Sort by proximity if userLocation is available
    if (userLocation) {
      filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    setSpots(filtered);
  }, [activeProvinceId, initialSpots, nearestProvince, userLocation, selectedPlaceCategory]);

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
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
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
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount']
      });

      if (place.location && map) {
        const spotLoc = { lat: place.location.lat(), lng: place.location.lng() };
        const dist = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, spotLoc.lat, spotLoc.lng) : undefined;
        const newSpot: PlaceSpot = {
          id: place.id || `spot-${Date.now()}`,
          name: place.displayName || suggestion.placePrediction.text.text,
          address: place.formattedAddress || '',
          location: spotLoc,
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          category: 'Search Result',
          distanceKm: dist,
        };

        setSpots(prev => [newSpot, ...prev.filter(s => s.id !== newSpot.id)]);
        setSelectedSpot(newSpot);
        map.panTo(newSpot.location);
        map.setZoom(15);
      }
    } catch (err: any) {
      setMapError("Could not retrieve place details. Try another venue.");
    } finally {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleCategorySearch = async (cat: typeof CATEGORIES[0]) => {
    setSelectedCategory(cat.id);
    if (!placesLib) return;

    setIsSearching(true);
    try {
      const center = map?.getCenter() || DEFAULT_CENTER;
      const lat = typeof center.lat === 'function' ? center.lat() : center.lat;
      const lng = typeof center.lng === 'function' ? center.lng() : center.lng;

      const request = {
        textQuery: `${cat.query} South Africa`,
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'priceLevel'],
        locationBias: { center: { lat, lng }, radius: 25000 },
        maxResultCount: 10
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
            id: p.id || `cat-${idx}-${Date.now()}`,
            name: p.displayName || cat.label,
            address: p.formattedAddress || 'South Africa',
            location: loc,
            rating: p.rating,
            userRatingCount: p.userRatingCount,
            priceLevel: p.priceLevel as string,
            category: cat.label,
            distanceKm: dist,
          };
        });
        setSpots(newSpots);
      }
    } catch (err) {
      console.warn("Category search error:", err);
    } finally {
      setIsSearching(false);
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
            name: p.displayName || `${catOption.shortLabel} Spot`,
            address: p.formattedAddress || 'South Africa',
            location: loc,
            rating: p.rating,
            userRatingCount: p.userRatingCount,
            priceLevel: p.priceLevel as string,
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
    } catch (err) {
      console.warn("Category Places search error:", err);
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
          setMapError("Location permission not granted. Use the province buttons above to explore any region.");
        }
      );
    }
  };

  const activeCategoryOption = PLACE_CATEGORY_OPTIONS.find(o => o.id === selectedPlaceCategory) || PLACE_CATEGORY_OPTIONS[0];

  return (
    <div className="relative w-full h-[660px] sm:h-[740px] rounded-3xl overflow-hidden border border-outline-variant/15 shadow-md flex flex-col bg-surface-container">
      {/* Top Controls Bar */}
      <div className="p-3 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/15 z-20 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Autocomplete Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search romantic venues, suburbs, or cities across SA..."
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
              <span className="hidden sm:inline">List ({spots.length})</span>
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
              <span className="text-[10px] opacity-80 font-bold px-1 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
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
                    <span className="text-[10px] text-outline">
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
                              <span className="text-[11px] font-bold text-outline shrink-0 bg-surface-container px-1.5 py-0.5 rounded-md">
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
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
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

          {/* Near Me Quick Jump */}
          <button
            onClick={() => handleSelectProvince('near-me')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer min-h-[32px] ${
              activeProvinceId === 'near-me'
                ? 'bg-primary text-on-primary-fixed border-primary shadow-xs'
                : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'
            }`}
          >
            <Navigation className="w-3 h-3 text-current" />
            <span>📍 Near Me</span>
          </button>

          {/* All SA Provinces */}
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

          {/* 9 Provinces Buttons */}
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

      {/* Meaningful Result Header with Category Indication */}
      <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between text-xs text-outline flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-on-surface">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>
              Showing <strong>{spots.length}</strong> {selectedPlaceCategory === 'all' ? 'date destinations' : (
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

        {isSearching && (
          <span className="flex items-center gap-1 text-primary font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching Google Places...
          </span>
        )}
      </div>

      {/* Main Surface: Map or List */}
      <div className="flex-1 relative overflow-hidden">
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

              {/* Spots Markers with Category Badges */}
              {spots.map(spot => {
                const catOption = getSpotCategoryOption(spot);
                const Icon = catOption.icon;
                const isSelected = selectedSpot?.id === spot.id;
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
                      className={`p-2 rounded-xl shadow-md border cursor-pointer transition-all duration-200 hover:scale-115 flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary text-white border-white ring-4 ring-primary/40 scale-110 shadow-lg z-30'
                          : `${catOption.colorClass} border-white/60 hover:brightness-110 shadow-sm`
                      }`}
                      title={`${spot.name} • ${catOption.shortLabel}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>

            {/* Floating Map Buttons */}
            <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
              <button
                onClick={handleNearMe}
                title="Find Near Me"
                className="p-3 bg-surface-container/90 hover:bg-surface-container text-primary rounded-full shadow-lg border border-outline-variant/30 backdrop-blur-md cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <Compass className="w-5 h-5" />
                <span className="hidden sm:inline">Near Me</span>
              </button>
            </div>
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
                  We couldn't find any places matching "{selectedPlaceCategory}" in {
                    activeProvinceId === 'near-me' ? (nearestProvince?.name || 'your area') :
                    activeProvinceId === 'all' ? 'the selected region' :
                    (SA_PROVINCES.find(p => p.id === activeProvinceId)?.name || 'this province')
                  }. Try selecting "All Places" or exploring other provinces.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPlaceCategory('all')}
                  >
                    View All Categories
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectProvince('all')}
                  >
                    Explore All SA
                  </Button>
                </div>
              </div>
            ) : (
              spots.map(spot => {
                const catOption = getSpotCategoryOption(spot);
                const CatIcon = catOption.icon;
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category Badge */}
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${catOption.badgeBg} ${catOption.badgeText}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{catOption.shortLabel}</span>
                          </span>

                          <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary px-2 py-0.5 rounded-md bg-secondary/10">
                            {spot.category || 'Date Venue'}
                          </span>
                          {spot.mood && (
                            <MoodBadge mood={spot.mood} size="sm" variant="compact" />
                          )}
                          {spot.distanceKm !== undefined && (
                            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              {spot.distanceKm} km away
                            </span>
                          )}
                          {spot.priceLevel && (
                            <span className="text-xs font-semibold text-outline">{spot.priceLevel}</span>
                          )}
                        </div>
                        <h3 className="font-serif text-lg font-bold text-on-surface truncate">{spot.name}</h3>
                        <p className="text-xs text-outline flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {spot.address}
                        </p>
                      </div>

                      {spot.rating && (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
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

                    <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between gap-2 mt-3">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.name} ${spot.address}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-secondary hover:underline flex items-center gap-1 font-medium"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </a>

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

      {/* Venue Details Mobile Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedSpot)}
        onClose={() => setSelectedSpot(null)}
        title={selectedSpot?.name}
      >
        {selectedSpot && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-semibold text-secondary px-2.5 py-0.5 rounded-md bg-secondary/10">
                {selectedSpot.category || 'Romantic Spot'}
              </span>
              {selectedSpot.mood && (
                <MoodBadge mood={selectedSpot.mood} size="sm" />
              )}
              {selectedSpot.distanceKm !== undefined && (
                <span className="font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-0.5 rounded-full">
                  <Navigation className="w-3 h-3" />
                  {selectedSpot.distanceKm} km away from you
                </span>
              )}
              {selectedSpot.rating && (
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {selectedSpot.rating} ({selectedSpot.userRatingCount?.toLocaleString() || '100+'} reviews)
                </span>
              )}
              {selectedSpot.priceLevel && (
                <span className="font-semibold text-outline">{selectedSpot.priceLevel}</span>
              )}
            </div>

            <p className="text-xs text-outline flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{selectedSpot.address}</span>
            </p>

            {selectedSpot.summary && (
              <p className="text-xs text-on-surface/90 leading-relaxed bg-surface-container-high/50 p-3 rounded-xl border border-outline-variant/10">
                {selectedSpot.summary}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {onPlanDate && (
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
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
                  Plan Date Night Here
                </Button>
              )}

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
                  Save to Wishlist
                </Button>
              )}

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedSpot.name} ${selectedSpot.address}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                Directions
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
    <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
      <MapContent {...props} />
    </APIProvider>
  );
}
