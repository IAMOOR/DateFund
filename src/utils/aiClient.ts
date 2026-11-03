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

export interface DiscoverItem {
  title: string;
  summary: string;
  category: string;
  estimatedBudget: number;
  imageSearchTerm?: string;
  sourceName?: string;
  isAiGenerated?: boolean;
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
