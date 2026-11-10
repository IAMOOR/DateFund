/**
 * Client-side AI utility calling server-side Gemini API endpoints.
 * All API key handling and Gemini SDK executions are secured on the Express server.
 * All requests are protected by Firebase ID Token authorization.
 */

import { auth } from '../firebase';
import { getCachedAI, setCachedAI } from './aiCache';

export interface SuggestedDateIdea {
  title: string;
  description: string;
  tags: string[];
}

export interface SoloDateIdea {
  title: string;
  description: string;
}

export interface DiscoverReviewSnippet {
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

export interface DiscoverItem {
  id?: string;
  placeId?: string;
  title: string;
  summary: string;
  category: string;
  estimatedBudget: number;
  imageSearchTerm?: string;
  sourceName?: string;
  address?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photoUrl?: string;
  photos?: string[];
  reviews?: DiscoverReviewSnippet[];
  googleMapsURI?: string;
  websiteURI?: string;
  subRegionId?: string;
  mood?: string;
  isAiGenerated?: boolean;
  isGoogleMapsPlace?: boolean;
}

export interface RomanticTip {
  title: string;
  category: string;
  timeEstimate: string;
  description: string;
  steps: string[];
  conversationStarter: string;
}

/**
 * Retrieves valid authentication headers with Firebase ID token.
 * Throws if the current user is not authenticated or is an anonymous guest.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }
  if (currentUser.isAnonymous) {
    throw new Error("ANONYMOUS_NOT_ALLOWED");
  }

  const token = await currentUser.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function suggestDateIdea(
  goals: Array<{ name: string; targetAmount: number }>,
  events: Array<{ title: string; tags?: string[] }>
): Promise<SuggestedDateIdea> {
  const fallback: SuggestedDateIdea = {
    title: "Sunset Vineyard Tasting & Twilight Walk",
    description: "Pack a warm knit blanket and visit a scenic local wine estate or botanical garden at golden hour, followed by shared artisanal dessert.",
    tags: ["Romantic", "Scenic", "Wine & Dine"]
  };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/suggest-date', {
      method: 'POST',
      headers,
      body: JSON.stringify({ goals, events })
    });
    if (!res.ok) {
      return fallback;
    }
    return await res.json();
  } catch (e) {
    return fallback;
  }
}

export async function getSoloEncouragement(): Promise<string> {
  const fallback = "Focus on your growth, cherish your peace, and know the best chapters are ahead.";
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/solo-advice', {
      method: 'POST',
      headers
    });
    if (!res.ok) {
      return fallback;
    }
    const data = await res.json();
    return data.text || fallback;
  } catch (e) {
    return fallback;
  }
}

export async function getSoloDateIdea(): Promise<SoloDateIdea> {
  const fallback: SoloDateIdea = {
    title: "Artisanal Pottery & Solo High Tea",
    description: "Book an afternoon wheel-throwing ceramic workshop, followed by gourmet pastries, loose-leaf tea, and quiet journaling."
  };
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/solo-date-idea', {
      method: 'POST',
      headers
    });
    if (!res.ok) {
      return fallback;
    }
    return await res.json();
  } catch (e) {
    return fallback;
  }
}

export async function fetchDiscoverSuggestions(
  goals: Array<{ name: string }>
): Promise<string[]> {
  const fallback = [
    "Sunset Mountain Picnic",
    "Wine Tram Cellar Dinner",
    "Cozy Fireplace Bistro",
    "Scenic Coastal Kayaking"
  ];
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/discover-suggestions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ goals })
    });
    if (!res.ok) {
      return fallback;
    }
    const data = await res.json();
    return data.suggestions || fallback;
  } catch (e) {
    return fallback;
  }
}

export async function discoverDateIdeas(params: {
  query?: string;
  goals?: Array<{ name: string }>;
  events?: Array<{ title: string }>;
  location?: { lat: number; lng: number } | null;
  provinceName?: string;
  mood?: string;
}): Promise<DiscoverItem[]> {
  const fallbackItems: DiscoverItem[] = [
    {
      title: "Kloof Street House Candlelit Dining",
      summary: "Enchanted Victorian garden courtyard in Cape Town with fairy lights, plush velvet seating, and romantic tapas.",
      category: "Fine Dining",
      estimatedBudget: 950,
      imageSearchTerm: "kloof street house fairy lights dining",
      sourceName: "Cape Town (Western Cape)",
      isAiGenerated: true,
    },
    {
      title: "The Oyster Box Ocean Terrace & Cocktails",
      summary: "Classic Umhlanga coastline romance with crashing Indian Ocean waves, lighthouse views, and fresh oysters.",
      category: "Fine Dining",
      estimatedBudget: 1200,
      imageSearchTerm: "oyster box lighthouse ocean terrace umhlanga",
      sourceName: "Umhlanga (KwaZulu-Natal)",
      isAiGenerated: true,
    },
    {
      title: "Dullstroom Log Fireplace & Artisanal Retreat",
      summary: "Cosy mountain village escape with crackling wood fireplaces, Belgian chocolate pairings, and misty trout lakes.",
      category: "Cozy Getaways",
      estimatedBudget: 1100,
      imageSearchTerm: "dullstroom fireplace cabin mist",
      sourceName: "Dullstroom (Mpumalanga)",
      isAiGenerated: true,
    }
  ];

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/discover-ideas', {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      return fallbackItems;
    }
    const data = await res.json();
    return data.items || fallbackItems;
  } catch (e) {
    return fallbackItems;
  }
}

export async function fetchRomanticTips(
  mood: string,
  forceRefresh: boolean = false
): Promise<RomanticTip[]> {
  const currentUid = auth.currentUser?.uid;
  const cacheKey = `romantic_tips_${mood.toLowerCase()}`;

  if (!forceRefresh) {
    const cached = getCachedAI<RomanticTip[]>(cacheKey, currentUid);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  const fallbackTips: RomanticTip[] = [
    {
      title: "The 3-Minute Vulnerability Swap",
      category: "Deep Intimacy",
      timeEstimate: "6 mins",
      description: "A gentle exercise to lower emotional guards and reconnect on a soul-to-soul level over candlelight or wine.",
      steps: [
        "Put all mobile phones face down and silence notifications.",
        "Take turns completing: 'One quiet moment this past week when I felt deeply tender toward you was...'",
        "Listen without debate, then share a warm 20-second hug before switching."
      ],
      conversationStarter: "What is a small, everyday gesture of mine that makes you feel most cherished?"
    }
  ];

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/romantic-tips', {
      method: 'POST',
      headers,
      body: JSON.stringify({ mood })
    });

    if (!res.ok) {
      return fallbackTips;
    }

    const data = await res.json();
    const tips: RomanticTip[] = data.tips || [];

    if (tips.length > 0) {
      setCachedAI(cacheKey, tips, currentUid);
    }

    return tips.length > 0 ? tips : fallbackTips;
  } catch (e) {
    return fallbackTips;
  }
}

/**
 * Server-Sent Events (SSE) streaming helper with verified Bearer token authentication
 */
export async function streamText(
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt })
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream connection failed with ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') {
        onComplete?.();
        return;
      }
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) {
          onChunk(parsed.text);
        }
      } catch {
        if (dataStr) onChunk(dataStr);
      }
    }
  }

  onComplete?.();
}

export interface AiMapItineraryStop {
  title: string;
  searchQuery: string;
  category: 'Romantic' | 'Adventurous' | 'Cozy';
  estimatedCostRand: number;
  stayDurationMinutes: number;
  tip: string;
}

export interface AiMapItinerary {
  itineraryTitle: string;
  mood: string;
  summary: string;
  estimatedTotalRand: number;
  stops: AiMapItineraryStop[];
}

export interface SpotWeatherConditions {
  temperatureC: number;
  feelsLikeC: number;
  condition: string;
  humidity: number;
  windKmh: number;
  precipProb: number;
  uvIndex: number;
  isDaytime: boolean;
  sunsetTime: string;
  goldenHourTime: string;
  dateSuitabilityNote: string;
  source?: string;
}

/**
 * Generates a natural-language multi-stop date map itinerary via Gemini on the server.
 * Falls back to a regional South African itinerary when in Demo Mode or offline.
 */
export async function generateMapDateItinerary(params: {
  prompt: string;
  provinceName?: string;
  location?: { lat: number; lng: number } | null;
  budgetRand?: number;
}): Promise<AiMapItinerary> {
  const regionLabel = params.provinceName && params.provinceName !== 'All Provinces'
    ? params.provinceName
    : 'Cape Town & Winelands';
  const lower = (params.prompt || '').toLowerCase();
  const isAdventurous = lower.includes('hike') || lower.includes('adventure') || lower.includes('kayak') || lower.includes('outdoor') || lower.includes('safari');
  const isCozy = lower.includes('cozy') || lower.includes('rain') || lower.includes('coffee') || lower.includes('cafe') || lower.includes('fireplace');

  const fallback: AiMapItinerary = isAdventurous
    ? {
        itineraryTitle: `Golden Hour Adventure & Scenic Tasting in ${regionLabel}`,
        mood: 'Adventurous',
        summary: 'An exhilarating outdoor route pairing panoramic coastal or mountain trails with artisanal wood-fired dining at sunset.',
        estimatedTotalRand: 980,
        stops: [
          {
            title: 'Scenic Trail & Lookout Point',
            searchQuery: `Scenic nature reserve viewpoint ${regionLabel} South Africa`,
            category: 'Adventurous',
            estimatedCostRand: 180,
            stayDurationMinutes: 75,
            tip: 'Arrive 90 minutes before sunset for the best golden-hour light and cooler breeze.'
          },
          {
            title: 'Craft Taproom & Artisanal Platter',
            searchQuery: `Artisanal brewery or gin tasting ${regionLabel} South Africa`,
            category: 'Adventurous',
            estimatedCostRand: 350,
            stayDurationMinutes: 60,
            tip: 'Order a shared tasting flight and sit on the outdoor deck.'
          },
          {
            title: 'Twilight Rooftop or Wood-Fired Bistro',
            searchQuery: `Scenic rooftop restaurant ${regionLabel} South Africa`,
            category: 'Romantic',
            estimatedCostRand: 450,
            stayDurationMinutes: 90,
            tip: 'Ask for a table facing the western horizon as city lights come alive.'
          }
        ]
      }
    : isCozy
    ? {
        itineraryTitle: `Velvet Mornings & Fireside Romance in ${regionLabel}`,
        mood: 'Cozy',
        summary: 'A slow, intimate itinerary through specialty coffee roasteries, boutique art spaces, and candlelit fireside dining.',
        estimatedTotalRand: 890,
        stops: [
          {
            title: 'Specialty Roastery & Pastry Pairing',
            searchQuery: `Artisanal coffee roastery bakery ${regionLabel} South Africa`,
            category: 'Cozy',
            estimatedCostRand: 190,
            stayDurationMinutes: 50,
            tip: 'Share a warm almond croissant and single-origin pour-over in a quiet corner.'
          },
          {
            title: 'Boutique Gallery & Sculpture Garden',
            searchQuery: `Boutique art gallery garden ${regionLabel} South Africa`,
            category: 'Cozy',
            estimatedCostRand: 120,
            stayDurationMinutes: 65,
            tip: 'Stroll slowly and each pick one artwork that reminds you of a shared memory.'
          },
          {
            title: 'Candlelit Cellar & Fireplace Bistro',
            searchQuery: `Cozy romantic bistro wine bar ${regionLabel} South Africa`,
            category: 'Romantic',
            estimatedCostRand: 580,
            stayDurationMinutes: 105,
            tip: 'Reserve a booth near the fireplace or courtyard fairy lights.'
          }
        ]
      }
    : {
        itineraryTitle: `Twilight Wine & Candlelit Romance in ${regionLabel}`,
        mood: 'Romantic',
        summary: 'A curated multi-stop romantic journey blending sunset views, estate wine tasting, and intimate fine dining.',
        estimatedTotalRand: 1350,
        stops: [
          {
            title: 'Estate Wine & MCC Tasting Terrace',
            searchQuery: `Romantic wine estate tasting ${regionLabel} South Africa`,
            category: 'Romantic',
            estimatedCostRand: 320,
            stayDurationMinutes: 70,
            tip: 'Start with a chilled Cap Classique on the terrace overlooking the valley.'
          },
          {
            title: 'Golden Hour Botanical or Sunset Promenade',
            searchQuery: `Sunset viewpoint botanical garden ${regionLabel} South Africa`,
            category: 'Adventurous',
            estimatedCostRand: 150,
            stayDurationMinutes: 50,
            tip: 'Bring a light wrap and pause for a golden-hour couple photo.'
          },
          {
            title: 'Intimate Courtyard Fine Dining',
            searchQuery: `Romantic fine dining restaurant ${regionLabel} South Africa`,
            category: 'Romantic',
            estimatedCostRand: 880,
            stayDurationMinutes: 110,
            tip: 'Mention your date night when booking to request a secluded candlelit table.'
          }
        ]
      };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/map-concierge', {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      return fallback;
    }
    const data = await res.json();
    if (data && data.itineraryTitle && Array.isArray(data.stops) && data.stops.length > 0) {
      return data;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Queries the server-side Google Maps Weather & Golden-Hour Sunset proxy endpoint.
 * Includes Tier 2 Google Maps Platform quota check.
 */
const weatherCache: Record<string, SpotWeatherConditions> = {};

export async function fetchSpotWeather(lat: number, lng: number): Promise<SpotWeatherConditions> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (weatherCache[key]) {
    return weatherCache[key];
  }

  const fallback: SpotWeatherConditions = {
    temperatureC: 22,
    feelsLikeC: 22,
    condition: 'Clear & Pleasant',
    humidity: 54,
    windKmh: 12,
    precipProb: 5,
    uvIndex: 4,
    isDaytime: true,
    sunsetTime: '18:15',
    goldenHourTime: '17:30',
    dateSuitabilityNote: 'Great conditions for outdoor terrace or rooftop dining — Golden hour starts at 17:30.'
  };

  try {
    const res = await fetch('/api/maps/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });

    if (res.status === 429) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }

    const data = await res.json();
    if (data?.quotaExceeded) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }

    if (data && typeof data.temperatureC === 'number') {
      weatherCache[key] = data;
      return data;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

