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
  validateStreamRequest
} from "./server/validators.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize server-side Gemini SDK instance securely
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[Server] GEMINI_API_KEY is not defined. Server AI features will operate with curated romantic fallbacks.");
}
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
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

      if (!ai) {
        return res.json(fallbackIdea);
      }

      try {
        const goalsContext = goals.map((g: any) => `${g.name || 'Goal'} (Target: R ${g.targetAmount || 0})`).join(", ");
        const eventsContext = events.map((e: any) => `${e.title || 'Date'} (${(e.tags || []).join(", ") || "no tags"})`).join(", ");

        const prompt = `Based on these financial goals: [${goalsContext}] and these past/planned events: [${eventsContext}], suggest ONE creative and romantic date idea.
The idea should be realistic and align with the goals (e.g., if they are saving for a big trip, suggest a low-cost but high-romance local date; if they have a "Fine Dining" goal, suggest a fancy restaurant idea).
Return the response as a JSON object with 'title', 'description', and 'tags' (array of strings).`;

        const response = await runWithTimeout(
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              maxOutputTokens: 600,
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
        console.error("[Server] /api/ai/suggest-date error:", err.message || err);
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

      if (!ai) {
        return res.json({ text: fallbackAdvice });
      }

      try {
        const prompt = "Give a short, uplifting word of encouragement or advice for someone who is focusing on their solo journey and financial independence after a breakup. Keep it under 20 words.";
        const response = await runWithTimeout(
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              maxOutputTokens: 150
            }
          })
        );
        return res.json({ text: response.text?.trim() || fallbackAdvice });
      } catch (err: any) {
        console.error("[Server] /api/ai/solo-advice error:", err.message || err);
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

      if (!ai) {
        return res.json(fallbackSolo);
      }

      try {
        const prompt = "Suggest one creative and fulfilling solo date idea for someone focusing on self-love and independence. Return as JSON with 'title' and 'description'.";
        const response = await runWithTimeout(
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              maxOutputTokens: 300,
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
        console.error("[Server] /api/ai/solo-date-idea error:", err.message || err);
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

      if (!ai) {
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
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              maxOutputTokens: 250,
              responseMimeType: "application/json"
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
        console.error("[Server] /api/ai/discover-suggestions error:", err.message || err);
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

      if (!ai) {
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
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              maxOutputTokens: 900,
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
        console.error("[Server] /api/ai/discover-ideas error:", err.message || err);
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

      if (!ai) {
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
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              maxOutputTokens: 850,
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
        console.error("[Server] /api/ai/romantic-tips error:", err.message || err);
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

      if (!ai) {
        res.write(`data: ${JSON.stringify({ text: "Here is your romantic date suggestion: Pack a sunset picnic basket and stargaze tonight." })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      try {
        const responseStream = await runWithTimeout(
          ai.models.generateContentStream({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              maxOutputTokens: 500
            }
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
        console.error("[Server] /api/ai/stream error:", err.message || err);
        res.write(`data: ${JSON.stringify({ text: "Enjoy a special candlelit dinner together." })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
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
