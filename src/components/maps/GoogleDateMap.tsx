/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Event } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

// Default initial center (South Africa romantic hub)
const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 }; // Johannesburg

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
}

interface GoogleDateMapProps {
  events?: Event[];
  onPlanDate?: (dateInfo: { title: string; location: string; description?: string }) => void;
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>('romantic-dining');
  const [spots, setSpots] = useState<PlaceSpot[]>([
    {
      id: 'spot-1',
      name: 'Marble Restaurant',
      address: '19 Keyes Ave, Rosebank, Johannesburg',
      location: { lat: -26.1472, lng: 28.0375 },
      rating: 4.6,
      userRatingCount: 3120,
      priceLevel: '$$$$',
      category: 'Fine Dining',
      summary: 'Lively rooftop dining celebrating open-fire cooking and breathtaking city sunsets.'
    },
    {
      id: 'spot-2',
      name: 'Four Seasons The Westcliff Rooftop',
      address: '67 Jan Smuts Ave, Westcliff, Johannesburg',
      location: { lat: -26.1762, lng: 28.0325 },
      rating: 4.7,
      userRatingCount: 2450,
      priceLevel: '$$$$',
      category: 'Scenic & Sunset',
      summary: 'Iconic panoramic views over the Johannesburg jacaranda canopy with champagne pairings.'
    },
    {
      id: 'spot-3',
      name: 'Level Four Restaurant & Champagne Bar',
      address: '54 Bath Ave, Rosebank, Johannesburg',
      location: { lat: -26.1465, lng: 28.0412 },
      rating: 4.5,
      userRatingCount: 980,
      priceLevel: '$$$',
      category: 'Rooftops & Cocktails',
      summary: 'Chic intimate terrace setting with vintage cocktails and contemporary cuisine.'
    },
    {
      id: 'spot-4',
      name: 'Walter Sisulu Botanical Gardens',
      address: 'Malcolm Rd, Poortview, Roodepoort',
      location: { lat: -26.0867, lng: 27.8428 },
      rating: 4.8,
      userRatingCount: 5200,
      priceLevel: '$',
      category: 'Scenic & Sunset',
      summary: 'Picturesque waterfall, cliff walk, and peaceful couple picnic lawns.'
    }
  ]);
  const [selectedSpot, setSelectedSpot] = useState<PlaceSpot | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [mapError, setMapError] = useState<string | null>(null);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (placesLib && !sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  useEffect(() => {
    if (userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(13);
    }
  }, [userLocation, map]);

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
              radius: 20000
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
        const newSpot: PlaceSpot = {
          id: place.id || `spot-${Date.now()}`,
          name: place.displayName || suggestion.placePrediction.text.text,
          address: place.formattedAddress || '',
          location: { lat: place.location.lat(), lng: place.location.lng() },
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          category: 'Search Result'
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
        textQuery: cat.query,
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'priceLevel'],
        locationBias: { center: { lat, lng }, radius: 15000 },
        maxResultCount: 8
      };

      const { places } = await placesLib.Place.searchByText(request);
      if (places && places.length > 0) {
        const newSpots: PlaceSpot[] = places.map((p, idx) => ({
          id: p.id || `cat-${idx}-${Date.now()}`,
          name: p.displayName || cat.label,
          address: p.formattedAddress || 'Johannesburg Area',
          location: {
            lat: p.location?.lat() || (lat + (Math.random() - 0.5) * 0.05),
            lng: p.location?.lng() || (lng + (Math.random() - 0.5) * 0.05)
          },
          rating: p.rating,
          userRatingCount: p.userRatingCount,
          priceLevel: p.priceLevel as string,
          category: cat.label
        }));
        setSpots(newSpots);
      }
    } catch (err) {
      console.warn("Category search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNearMe = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.panTo(loc);
          map.setZoom(14);
          hapticSuccess();
        },
        () => {
          setMapError("Location permission denied. You can still search for any city or suburb.");
        }
      );
    }
  };

  return (
    <div className="relative w-full h-[600px] sm:h-[680px] rounded-3xl overflow-hidden border border-outline-variant/15 shadow-md flex flex-col bg-surface-container">
      {/* Top Compact Search and Controls Bar */}
      <div className="p-3 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/15 z-20 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Autocomplete Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search romantic venues, suburbs, or cities..."
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

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySearch(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                    : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meaningful Result Header */}
      <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between text-xs text-outline">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          Showing <strong>{spots.length} romantic venues</strong> in area
        </span>
        {isSearching && (
          <span className="flex items-center gap-1 text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
          </span>
        )}
      </div>

      {/* Main Surface: Map or List */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'map' ? (
          <>
            <Map
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={12}
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

              {/* Romantic Spots Markers */}
              {spots.map(spot => (
                <AdvancedMarker
                  key={spot.id}
                  position={spot.location}
                  title={spot.name}
                  onClick={() => {
                    hapticLight();
                    setSelectedSpot(spot);
                  }}
                >
                  <div className={`p-2 rounded-xl shadow-md border cursor-pointer transition-transform hover:scale-110 ${
                    selectedSpot?.id === spot.id
                      ? 'bg-primary text-on-primary-fixed border-white ring-2 ring-primary/40'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}>
                    <Wine className="w-4 h-4" />
                  </div>
                </AdvancedMarker>
              ))}
            </Map>

            {/* Floating Map Buttons */}
            <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
              <button
                onClick={handleNearMe}
                title="Find Near Me"
                className="p-3 bg-surface-container/90 hover:bg-surface-container text-primary rounded-full shadow-lg border border-outline-variant/30 backdrop-blur-md cursor-pointer"
              >
                <Compass className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          /* List View */
          <div className="w-full h-full overflow-y-auto p-4 space-y-3 bg-surface-container-low">
            {spots.map(spot => (
              <Card
                key={spot.id}
                variant="high"
                padding="md"
                className="hover:border-primary/40 cursor-pointer transition-all"
                onClick={() => setSelectedSpot(spot)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary px-2 py-0.5 rounded-md bg-secondary/10">
                        {spot.category || 'Romantic Spot'}
                      </span>
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
                          onPlanDate({ title: spot.name, location: spot.address, description: spot.summary });
                        }}
                      >
                        Plan Date
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
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
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-secondary px-2.5 py-0.5 rounded-md bg-secondary/10">
                {selectedSpot.category || 'Romantic Spot'}
              </span>
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
                      description: selectedSpot.summary || 'Romantic outing together.'
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
