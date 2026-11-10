import express from "express";
import type { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { authenticateUser } from "./server/auth.ts";
import { rateLimitUser, concurrencyLimitUser } from "./server/rateLimit.ts";
import {
  validateSuggestDateRequest,
  validateDiscoverSuggestionsRequest,
  validateDiscoverIdeasRequest,
  validateRomanticTipsRequest,
  validateStreamRequest,
  validateMapConciergeRequest,
  validateMapWeatherRequest
} from "./server/validators.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track keys that returned API_KEY_INVALID so we gracefully fall back without spamming failed requests
const rejectedApiKeys = new Set<string>();
let cachedAiKey: string | null = null;
let cachedAiClient: GoogleGenAI | null = null;

function isPlausibleGeminiApiKey(rawKey: string | undefined): rawKey is string {
  if (!rawKey) return false;
  const trimmed = rawKey.trim();
  if (!trimmed || trimmed.length < 20) return false;
  const upper = trimmed.toUpperCase();
  if (
    upper.includes("YOUR_") ||
    upper.includes("MY_GEMINI") ||
    upper.includes("PLACEHOLDER") ||
    upper === "UNDEFINED" ||
    upper === "NULL"
  ) {
    return false;
  }
  if (rejectedApiKeys.has(trimmed)) {
    return false;
  }
  return true;
}

export function getAiClient(): GoogleGenAI | null {
  const currentKey = process.env.GEMINI_API_KEY?.trim();
  if (!isPlausibleGeminiApiKey(currentKey)) {
    return null;
  }
  if (cachedAiClient && cachedAiKey === currentKey) {
    return cachedAiClient;
  }
  cachedAiKey = currentKey;
  cachedAiClient = new GoogleGenAI({
    apiKey: currentKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return cachedAiClient;
}

function handleGeminiFallbackError(routeName: string, err: any): void {
  const rawMessage = typeof err?.message === "string" ? err.message : String(err || "Unknown error");
  if (rawMessage.includes("API_KEY_INVALID") || rawMessage.includes("API key not valid")) {
    const currentKey = process.env.GEMINI_API_KEY?.trim();
    if (currentKey) {
      rejectedApiKeys.add(currentKey);
    }
    console.warn(
      `[Server] ${routeName}: GEMINI_API_KEY is invalid or not configured in Settings > Secrets. Using curated fallback.`
    );
    return;
  }
  console.warn(`[Server] ${routeName} fallback activated:`, rawMessage);
}

// Initial check at startup
if (!isPlausibleGeminiApiKey(process.env.GEMINI_API_KEY)) {
  console.warn("[Server] GEMINI_API_KEY is not defined. Server AI features will operate with curated romantic fallbacks.");
}
export const ai = getAiClient();
export const MODEL_NAME = "gemini-3.8-flash";
export const AI_REQUEST_TIMEOUT_MS = 15000;

/**
 * Timeout wrapper for AI calls to prevent hung connections and resource starvation.
 */
async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number = AI_REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("AI_REQUEST_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export function createApp() {
  const app = express();

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Strict request body limit (64KB) to mitigate Denial of Service
  app.use(express.json({ limit: "64kb" }));

  // Health endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Shared middleware chain for all protected AI routes
  const protectedAiRoute = [
    authenticateUser,
    rateLimitUser,
    concurrencyLimitUser
  ];

  // 1. Suggest Date Idea Endpoint
  app.post(
    "/api/ai/suggest-date",
    ...protectedAiRoute,
    validateSuggestDateRequest,
    async (req: Request, res: Response) => {
      const { goals = [], events = [] } = req.body || {};

      const fallbackIdea = {
        title: "Sunset Vineyard Tasting & Twilight Walk",
        description: "Pack a warm knit blanket and visit a scenic local wine estate or botanical garden at golden hour, followed by shared artisanal dessert.",
        tags: ["Romantic", "Scenic", "Wine & Dine"]
      };

      const client = getAiClient();
      if (!client) {
        return res.json(fallbackIdea);
      }

      try {
        const goalsContext = goals.map((g: any) => `${g.name || 'Goal'} (Target: R ${g.targetAmount || 0})`).join(", ");
        const eventsContext = events.map((e: any) => `${e.title || 'Date'} (${(e.tags || []).join(", ") || "no tags"})`).join(", ");

        const prompt = `Based on these financial goals: [${goalsContext}] and these past/planned events: [${eventsContext}], suggest ONE creative and romantic date idea.
The idea should be realistic and align with the goals (e.g., if they are saving for a big trip, suggest a low-cost but high-romance local date; if they have a "Fine Dining" goal, suggest a fancy restaurant idea).
Return the response as a JSON object with 'title', 'description', and 'tags' (array of strings).`;

        const response = await runWithTimeout(
          client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "description", "tags"]
              }
            }
          })
        );

        const cleanText = (response.text || "").replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanText || "{}");
        if (parsed.title && parsed.description) {
          return res.json(parsed);
        }
        return res.json(fallbackIdea);
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/suggest-date", err);
        return res.json(fallbackIdea);
      }
    }
  );

  // 2. Solo Advice / Encouragement Endpoint
  app.post(
    "/api/ai/solo-advice",
    ...protectedAiRoute,
    async (_req: Request, res: Response) => {
      const fallbackAdvice = "Focus on your growth, cherish your peace, and know the best chapters are ahead.";

      const client = getAiClient();
      if (!client) {
        return res.json({ text: fallbackAdvice });
      }

      try {
        const prompt = "Give a short, uplifting word of encouragement or advice for someone who is focusing on their solo journey and financial independence after a breakup. Keep it under 20 words.";
        const response = await runWithTimeout(
          client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt
          })
        );
        return res.json({ text: response.text?.trim() || fallbackAdvice });
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/solo-advice", err);
        return res.json({ text: fallbackAdvice });
      }
    }
  );

  // 3. Solo Date Idea Endpoint
  app.post(
    "/api/ai/solo-date-idea",
    ...protectedAiRoute,
    async (_req: Request, res: Response) => {
      const fallbackSolo = {
        title: "Artisanal Pottery & Solo High Tea",
        description: "Book an afternoon wheel-throwing ceramic workshop, followed by gourmet pastries, loose-leaf tea, and quiet journaling."
      };

      const client = getAiClient();
      if (!client) {
        return res.json(fallbackSolo);
      }

      try {
        const prompt = "Suggest one creative and fulfilling solo date idea for someone focusing on self-love and independence. Return as JSON with 'title' and 'description'.";
        const response = await runWithTimeout(
          client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            }
          })
        );

        const cleanText = (response.text || "").replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanText || "{}");
        if (parsed.title && parsed.description) {
          return res.json(parsed);
        }
        return res.json(fallbackSolo);
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/solo-date-idea", err);
        return res.json(fallbackSolo);
      }
    }
  );

  // 4. Discover Catchy Search Query Suggestions Endpoint
  app.post(
    "/api/ai/discover-suggestions",
    ...protectedAiRoute,
    validateDiscoverSuggestionsRequest,
    async (req: Request, res: Response) => {
      const { goals = [] } = req.body || {};
      const fallbackSuggestions = [
        "Sunset Mountain Picnic",
        "Wine Tram Cellar Dinner",
        "Cozy Fireplace Bistro",
        "Scenic Coastal Kayaking"
      ];

      const client = getAiClient();
      if (!client) {
        return res.json({ suggestions: fallbackSuggestions });
      }

      try {
        const goalsContext = goals.length > 0
          ? `The user is saving for: ${goals.map((g: any) => g.name || g).join(", ")}.`
          : "";

        const prompt = `You are a romantic date and travel expert.
${goalsContext}
Suggest 4 short, catchy search queries (2-4 words each) for romantic date ideas or weekend getaways.
Return a JSON array of strings.`;

        const response = await runWithTimeout(
          client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          })
        );

        const cleanText = (response.text || "").replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanText || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ suggestions: parsed });
        }
        return res.json({ suggestions: fallbackSuggestions });
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/discover-suggestions", err);
        return res.json({ suggestions: fallbackSuggestions });
      }
    }
  );

  // 5. Discover Inspiring Date Ideas Endpoint (All SA Provinces & Nearby)
  app.post(
    "/api/ai/discover-ideas",
    ...protectedAiRoute,
    validateDiscoverIdeasRequest,
    async (req: Request, res: Response) => {
      const { query = "", goals = [], events = [], location, provinceName, mood } = req.body || {};

      const fallbackItems = [
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
        },
        {
          title: "Tsitsikamma Storms River Suspension Bridge Walk",
          summary: "Suspension bridge swaying over dark oceanic gorge waters surrounded by ancient yellowwood forests.",
          category: "Adventure",
          estimatedBudget: 420,
          imageSearchTerm: "tsitsikamma suspension bridge ocean storms river",
          sourceName: "Garden Route (Eastern Cape)",
          isAiGenerated: true,
        },
        {
          title: "Harties Aerial Cableway & Sunset Mountain Views",
          summary: "Cable car ascent up the Magaliesberg ridge with panoramic dam views, mountain champagne, and sunset walk.",
          category: "Scenic & Sunset",
          estimatedBudget: 750,
          imageSearchTerm: "hartbeespoort cableway sunset dam",
          sourceName: "Hartbeespoort (North West)",
          isAiGenerated: true,
        }
      ];

      const client = getAiClient();
      if (!client) {
        return res.json({ items: fallbackItems });
      }

      try {
        const goalsContext = goals.length > 0
          ? `The user is saving for: ${goals.map((g: any) => g.name || g).join(", ")}.`
          : "";
        const eventsContext = events.length > 0
          ? `The user has planned: ${events.map((e: any) => e.title || e).join(", ")}.`
          : "";
        
        const locationContext = location && location.lat && location.lng
          ? `The user's real GPS coordinates are: lat ${location.lat}, lng ${location.lng}${provinceName ? ` (${provinceName} province)` : ''}.
CRITICAL REQUIREMENT: Recommend date spots, restaurants, and activities that are located in ${provinceName || 'their province'} and situated as close as possible to these coordinates.`
          : provinceName
          ? `CRITICAL REQUIREMENT: The user has selected the "${provinceName}" province in South Africa. All recommendations MUST be restaurants, romantic activities, and scenic date spots physically situated in ${provinceName}.`
          : "CRITICAL REQUIREMENT: Recommend diverse romantic date destinations spanning across different South African provinces.";

        const moodContext = mood ? `Desired date mood/vibe: "${mood}".` : "";

        const prompt = `You are an expert romantic date concierge for South Africa.
${goalsContext} ${eventsContext}
${locationContext}
${moodContext}

Search query or theme: "${query || "romantic date spots and activities"}"

Suggest 5 inspiring and realistic date spots or activities in South Africa matching this geographical context.
For each spot, return a JSON array of objects with fields:
- title (string): evocative venue or activity title
- summary (string): 2-3 romantic sentences describing the experience
- category (string): e.g. "Fine Dining", "Adventure", "Cozy & Wine", "Scenic Sunset", "Cultural", "Getaway"
- estimatedBudget (number): estimated cost in South African Rand (ZAR, e.g. 750)
- imageSearchTerm (string): search term for photo
- sourceName (string): town or province
- isAiGenerated: true`;

        const response = await runWithTimeout(
          client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          })
        );

        const cleanText = (response.text || "").replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanText || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ items: parsed });
        }
        return res.json({ items: fallbackItems });
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/discover-ideas", err);
        return res.json({ items: fallbackItems });
      }
    }
  );

  // 6. Romantic Tips & Communication Exercises Endpoint
  app.post(
    "/api/ai/romantic-tips",
    ...protectedAiRoute,
    validateRomanticTipsRequest,
    async (req: Request, res: Response) => {
      const { mood = "Romantic" } = req.body || {};

      const MOOD_FALLBACKS: Record<string, Array<{
        title: string;
        category: string;
        timeEstimate: string;
        description: string;
        steps: string[];
        conversationStarter: string;
      }>> = {
        Romantic: [
          {
            title: "The 3-Minute Vulnerability Swap",
            category: "Deep Intimacy",
            timeEstimate: "6 mins",
            description: "A gentle exercise to lower emotional guards and reconnect on a soul-to-soul level over candlelight or wine.",
            steps: [
              "Put all mobile phones face down and silence notifications.",
              "Take turns completing the sentence: 'One quiet moment this past week when I felt deeply tender toward you was...'",
              "Listen without comment or debate, then share a warm 20-second hug before switching."
            ],
            conversationStarter: "What is a small, everyday gesture of mine that makes you feel most cherished?"
          },
          {
            title: "Gaze & Gratitude Attunement",
            category: "Non-Verbal Connection",
            timeEstimate: "4 mins",
            description: "Sustained soft eye contact triggers oxytocin release and dissolves superficial stress.",
            steps: [
              "Sit opposite each other, close enough for knees to touch.",
              "Hold soft, unbroken eye contact in silence for 60 seconds with relaxed breathing.",
              "Each share one honest truth about what you saw in the other's eyes."
            ],
            conversationStarter: "What was running through your mind during our very first date together?"
          },
          {
            title: "The Love Letter in a Whisper",
            category: "Emotional Attunement",
            timeEstimate: "5 mins",
            description: "Whispering slows heart rates and commands undivided emotional focus.",
            steps: [
              "Close your eyes while your partner holds both your hands.",
              "Your partner whispers 3 specific qualities they admire about your character, strength, and heart.",
              "Switch roles and repeat with equal sincerity."
            ],
            conversationStarter: "What personal dream of yours would you like me to champion more this year?"
          }
        ]
      };

      const fallbackForMood = MOOD_FALLBACKS[mood] || MOOD_FALLBACKS.Romantic;

      const client = getAiClient();
      if (!client) {
        return res.json({ mood, tips: fallbackForMood });
      }

      try {
        const prompt = `You are a licensed couples therapist and romantic dating coach.
The couple has selected the date mood: "${mood}".
Generate exactly 3 actionable, creative communication or relationship-building exercises for the couple to do before, during, or after their date.

Each tip must be concrete, emotionally intelligent, and psychologically sound.
Return the response as a JSON object with:
- mood: "${mood}"
- tips: an array of exactly 3 objects with title, category, timeEstimate, description, steps (array of 2-3 strings), conversationStarter`;

        const response = await runWithTimeout(
          client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  mood: { type: Type.STRING },
                  tips: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING },
                        timeEstimate: { type: Type.STRING },
                        description: { type: Type.STRING },
                        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                        conversationStarter: { type: Type.STRING }
                      },
                      required: ["title", "category", "timeEstimate", "description", "steps", "conversationStarter"]
                    }
                  }
                },
                required: ["mood", "tips"]
              }
            }
          })
        );

        const cleanText = (response.text || "").replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanText || "{}");
        if (parsed.tips && Array.isArray(parsed.tips) && parsed.tips.length > 0) {
          return res.json(parsed);
        }
        return res.json({ mood, tips: fallbackForMood });
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/romantic-tips", err);
        return res.json({ mood, tips: fallbackForMood });
      }
    }
  );

  // 7. Server-Sent Events (SSE) Streaming Endpoint (Protected with Authentication & Rate Limits)
  app.post(
    "/api/ai/stream",
    ...protectedAiRoute,
    validateStreamRequest,
    async (req: Request, res: Response) => {
      const { prompt } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const client = getAiClient();
      if (!client) {
        res.write(`data: ${JSON.stringify({ text: "Here is your romantic date suggestion: Pack a sunset picnic basket and stargaze tonight." })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      try {
        const responseStream = await runWithTimeout(
          client.models.generateContentStream({
            model: MODEL_NAME,
            contents: prompt
          })
        );

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/stream", err);
        res.write(`data: ${JSON.stringify({ text: "Enjoy a special candlelit dinner together." })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
    }
  );

  // 8. Natural-Language AI Map Date Concierge Endpoint (Protected with Authentication & Rate Limits)
  app.post(
    "/api/ai/map-concierge",
    ...protectedAiRoute,
    validateMapConciergeRequest,
    async (req: Request, res: Response) => {
      const { prompt, provinceName = "Western Cape", location, budgetRand } = req.body || {};

      const buildFallbackItinerary = (userPrompt: string, province: string) => {
        const lower = (userPrompt || "").toLowerCase();
        const isAdventurous = lower.includes("hike") || lower.includes("adventure") || lower.includes("kayak") || lower.includes("outdoor") || lower.includes("safari");
        const isCozy = lower.includes("cozy") || lower.includes("rain") || lower.includes("coffee") || lower.includes("cafe") || lower.includes("fireplace") || lower.includes("book");
        const regionLabel = province && province !== "All Provinces" ? province : "Cape Town & Winelands";

        if (isAdventurous) {
          return {
            itineraryTitle: `Golden Hour Adventure & Scenic Tasting in ${regionLabel}`,
            mood: "Adventurous",
            summary: "An exhilarating outdoor route pairing panoramic coastal or mountain trails with artisanal wood-fired dining at sunset.",
            estimatedTotalRand: 980,
            stops: [
              {
                title: "Scenic Trail & Lookout Point",
                searchQuery: `Scenic nature reserve viewpoint ${regionLabel} South Africa`,
                category: "Adventurous",
                estimatedCostRand: 180,
                stayDurationMinutes: 75,
                tip: "Arrive 90 minutes before sunset for the best golden-hour light and cooler breeze."
              },
              {
                title: "Craft Taproom & Artisanal Platter",
                searchQuery: `Artisanal brewery or gin tasting ${regionLabel} South Africa`,
                category: "Adventurous",
                estimatedCostRand: 350,
                stayDurationMinutes: 60,
                tip: "Order a shared tasting flight and sit on the outdoor deck."
              },
              {
                title: "Twilight Rooftop or Wood-Fired Bistro",
                searchQuery: `Scenic rooftop restaurant ${regionLabel} South Africa`,
                category: "Romantic",
                estimatedCostRand: 450,
                stayDurationMinutes: 90,
                tip: "Ask for a table facing the western horizon as city lights come alive."
              }
            ]
          };
        }

        if (isCozy) {
          return {
            itineraryTitle: `Velvet Mornings & Fireside Romance in ${regionLabel}`,
            mood: "Cozy",
            summary: "A slow, intimate itinerary through specialty coffee roasteries, boutique art spaces, and candlelit fireside dining.",
            estimatedTotalRand: 890,
            stops: [
              {
                title: "Specialty Roastery & Pastry Pairing",
                searchQuery: `Artisanal coffee roastery bakery ${regionLabel} South Africa`,
                category: "Cozy",
                estimatedCostRand: 190,
                stayDurationMinutes: 50,
                tip: "Share a warm almond croissant and single-origin pour-over in a quiet corner."
              },
              {
                title: "Boutique Gallery & Sculpture Garden",
                searchQuery: `Boutique art gallery garden ${regionLabel} South Africa`,
                category: "Cozy",
                estimatedCostRand: 120,
                stayDurationMinutes: 65,
                tip: "Stroll slowly and each pick one artwork that reminds you of a shared memory."
              },
              {
                title: "Candlelit Cellar & Fireplace Bistro",
                searchQuery: `Cozy romantic bistro wine bar ${regionLabel} South Africa`,
                category: "Romantic",
                estimatedCostRand: 580,
                stayDurationMinutes: 105,
                tip: "Reserve a booth near the fireplace or courtyard fairy lights."
              }
            ]
          };
        }

        return {
          itineraryTitle: `Twilight Wine & Candlelit Romance in ${regionLabel}`,
          mood: "Romantic",
          summary: "A curated multi-stop romantic journey blending sunset views, estate wine tasting, and intimate fine dining.",
          estimatedTotalRand: 1350,
          stops: [
            {
              title: "Estate Wine & MCC Tasting Terrace",
              searchQuery: `Romantic wine estate tasting ${regionLabel} South Africa`,
              category: "Romantic",
              estimatedCostRand: 320,
              stayDurationMinutes: 70,
              tip: "Start with a chilled Cap Classique on the terrace overlooking the valley."
            },
            {
              title: "Golden Hour Botanical or Sunset Promenade",
              searchQuery: `Sunset viewpoint botanical garden ${regionLabel} South Africa`,
              category: "Adventurous",
              estimatedCostRand: 150,
              stayDurationMinutes: 50,
              tip: "Bring a light wrap and pause for a golden-hour couple photo."
            },
            {
              title: "Intimate Courtyard Fine Dining",
              searchQuery: `Romantic fine dining restaurant ${regionLabel} South Africa`,
              category: "Romantic",
              estimatedCostRand: 880,
              stayDurationMinutes: 110,
              tip: "Mention your date night when booking to request a secluded candlelit table."
            }
          ]
        };
      };

      const fallbackItinerary = buildFallbackItinerary(prompt, provinceName);

      const client = getAiClient();
      if (!client) {
        return res.json(fallbackItinerary);
      }

      try {
        const locationDesc = location && typeof location.lat === "number" && typeof location.lng === "number"
          ? `User GPS coordinates: (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}) in ${provinceName || "South Africa"}.`
          : `Selected region: ${provinceName || "South Africa"}.`;
        const budgetDesc = budgetRand ? `Target couple budget: approximately R ${budgetRand}.` : "";

        const aiPrompt = `You are DateFund's AI Map Architect & Romantic Date Concierge for South Africa.
The couple described their desired date map experience: "${prompt}"
${locationDesc}
${budgetDesc}

Design a realistic, geographically coherent 3-stop date itinerary in South Africa that can be plotted directly on Google Maps using the Places API and connected with turn-by-turn routing.
For each stop:
- 'title': Evocative name of the real venue or date stop
- 'searchQuery': Precise Google Maps Places search query including the real venue name and suburb/city in South Africa so Places API finds the exact spot
- 'category': Must be one of "Romantic", "Adventurous", or "Cozy"
- 'estimatedCostRand': Estimated cost in South African Rand (ZAR) for a couple at this stop
- 'stayDurationMinutes': Recommended time spent at this stop in minutes (e.g., 60, 90)
- 'tip': One actionable insider tip for couples at this venue`;

        const response = await runWithTimeout(
          client.models.generateContent({
            model: MODEL_NAME,
            contents: aiPrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  itineraryTitle: { type: Type.STRING },
                  mood: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  estimatedTotalRand: { type: Type.NUMBER },
                  stops: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        searchQuery: { type: Type.STRING },
                        category: { type: Type.STRING },
                        estimatedCostRand: { type: Type.NUMBER },
                        stayDurationMinutes: { type: Type.NUMBER },
                        tip: { type: Type.STRING }
                      },
                      required: ["title", "searchQuery", "category", "estimatedCostRand", "stayDurationMinutes", "tip"]
                    }
                  }
                },
                required: ["itineraryTitle", "mood", "summary", "estimatedTotalRand", "stops"]
              }
            }
          })
        );

        const cleanText = (response.text || "").replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanText || "{}");
        if (parsed.itineraryTitle && Array.isArray(parsed.stops) && parsed.stops.length > 0) {
          return res.json(parsed);
        }
        return res.json(fallbackItinerary);
      } catch (err: any) {
        handleGeminiFallbackError("/api/ai/map-concierge", err);
        return res.json(fallbackItinerary);
      }
    }
  );

  // 9. Google Maps Weather & Golden Hour Sunset Proxy Endpoint
  app.post(
    "/api/maps/weather",
    validateMapWeatherRequest,
    async (req: Request, res: Response) => {
      const { lat, lng } = req.body;

      // Calculate astronomical sunset time in South Africa Standard Time (UTC+2)
      const computeLocalSunsetSAST = (latitude: number, longitude: number): { sunsetTime: string; goldenHourTime: string } => {
        const now = new Date();
        const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
        const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
        // Solar declination (degrees)
        const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
        const latRad = (latitude * Math.PI) / 180;
        const decRad = (declination * Math.PI) / 180;
        const cosHourAngle = Math.max(-0.95, Math.min(0.95, -Math.tan(latRad) * Math.tan(decRad)));
        const hourAngleDeg = (Math.acos(cosHourAngle) * 180) / Math.PI;
        // Solar noon in UTC hours, adjusted for longitude
        const solarNoonUTC = 12 - longitude / 15;
        const sunsetUTC = solarNoonUTC + hourAngleDeg / 15;
        // SAST is UTC+2
        const sunsetSAST = (sunsetUTC + 2 + 24) % 24;
        const goldenHourSAST = Math.max(0, sunsetSAST - 0.75);

        const formatDecimalHours = (decHours: number) => {
          const hrs = Math.floor(decHours);
          const mins = Math.round((decHours - hrs) * 60);
          const adjHrs = mins === 60 ? hrs + 1 : hrs;
          const adjMins = mins === 60 ? 0 : mins;
          return `${String(adjHrs).padStart(2, "0")}:${String(adjMins).padStart(2, "0")}`;
        };

        return {
          sunsetTime: formatDecimalHours(sunsetSAST),
          goldenHourTime: formatDecimalHours(goldenHourSAST)
        };
      };

      const { sunsetTime, goldenHourTime } = computeLocalSunsetSAST(lat, lng);

      // Build deterministic regional weather fallback based on South African latitude/longitude
      const buildRegionalFallbackWeather = () => {
        const isCoastal = lat < -32.5 || lng > 30.2;
        const seed = Math.abs(Math.round(lat * 100 + lng * 100)) % 7;
        const baseTemp = isCoastal ? 21 + (seed % 5) : 23 + (seed % 6);
        const conditions = isCoastal
          ? ["Clear Coastal Breeze", "Sunny & Crisp", "Golden Twilight Skies", "Mild Ocean Air"]
          : ["Sunny & Warm", "Clear Highveld Skies", "Mild & Pleasant", "Crisp Starlit Evening"];
        const condition = conditions[seed % conditions.length];
        const windKmh = isCoastal ? 14 + (seed % 9) : 9 + (seed % 7);
        const precipProb = seed === 5 ? 20 : 5;
        const humidity = isCoastal ? 64 : 46;

        return {
          temperatureC: baseTemp,
          feelsLikeC: baseTemp,
          condition,
          humidity,
          windKmh,
          precipProb,
          uvIndex: 4,
          isDaytime: true,
          sunsetTime,
          goldenHourTime,
          dateSuitabilityNote:
            precipProb <= 15 && windKmh <= 22
              ? `Ideal outdoor & terrace weather — Golden hour begins at ${goldenHourTime}.`
              : `Breezy evening expected — pack a warm wrap for sunset at ${sunsetTime}.`,
          source: "regional-estimate"
        };
      };

      const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!mapsApiKey) {
        return res.json(buildRegionalFallbackWeather());
      }

      try {
        const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(mapsApiKey)}&location.latitude=${encodeURIComponent(String(lat))}&location.longitude=${encodeURIComponent(String(lng))}&unitsSystem=METRIC`;
        const weatherRes = await fetch(weatherUrl, {
          method: "GET",
          headers: { Accept: "application/json" }
        });

        if (weatherRes.status === 429) {
          return res.status(429).json({
            ...buildRegionalFallbackWeather(),
            quotaExceeded: true,
            error: "RESOURCE_EXHAUSTED"
          });
        }

        if (!weatherRes.ok) {
          return res.json(buildRegionalFallbackWeather());
        }

        const data: any = await weatherRes.json();
        const tempC = typeof data?.temperature?.degrees === "number" ? Math.round(data.temperature.degrees) : 22;
        const feelsLikeC = typeof data?.feelsLikeTemperature?.degrees === "number" ? Math.round(data.feelsLikeTemperature.degrees) : tempC;
        const condition = data?.weatherCondition?.description?.text || "Clear & Pleasant";
        const humidity = typeof data?.relativeHumidity === "number" ? data.relativeHumidity : 55;
        const windKmh = typeof data?.wind?.speed?.value === "number" ? Math.round(data.wind.speed.value) : 12;
        const precipProb = typeof data?.precipitation?.probability?.percent === "number" ? data.precipitation.probability.percent : 5;
        const uvIndex = typeof data?.uvIndex === "number" ? data.uvIndex : 3;
        const isDaytime = typeof data?.isDaytime === "boolean" ? data.isDaytime : true;

        const dateSuitabilityNote =
          precipProb >= 40
            ? `Rain chance (${precipProb}%) — Cozy indoor fireplace or cellar table recommended.`
            : windKmh >= 28
            ? `Brisk breeze (${windKmh} km/h) — Sheltered courtyard seating ideal; sunset at ${sunsetTime}.`
            : `Great conditions for rooftop or garden dining — Golden hour starts at ${goldenHourTime}.`;

        return res.json({
          temperatureC: tempC,
          feelsLikeC,
          condition,
          humidity,
          windKmh,
          precipProb,
          uvIndex,
          isDaytime,
          sunsetTime,
          goldenHourTime,
          dateSuitabilityNote,
          source: "google-weather-api"
        });
      } catch (err: any) {
        console.warn("[Server] /api/maps/weather fallback:", err.message || err);
        return res.json(buildRegionalFallbackWeather());
      }
    }
  );

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Start server if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
