import express from "express";
import type { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize server-side Gemini SDK instance
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[Server] GEMINI_API_KEY is not defined. Server AI features will operate with curated romantic fallbacks.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL_NAME = "gemini-3.8-flash";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. Suggest Date Idea Endpoint
  app.post("/api/ai/suggest-date", async (req: Request, res: Response) => {
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

      const response = await ai.models.generateContent({
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
      });

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
  });

  // 2. Solo Advice / Encouragement Endpoint
  app.post("/api/ai/solo-advice", async (_req: Request, res: Response) => {
    const fallbackAdvice = "Focus on your growth, cherish your peace, and know the best chapters are ahead.";

    if (!ai) {
      return res.json({ text: fallbackAdvice });
    }

    try {
      const prompt = "Give a short, uplifting word of encouragement or advice for someone who is focusing on their solo journey and financial independence after a breakup. Keep it under 20 words.";
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });
      return res.json({ text: response.text?.trim() || fallbackAdvice });
    } catch (err: any) {
      console.error("[Server] /api/ai/solo-advice error:", err.message || err);
      return res.json({ text: fallbackAdvice });
    }
  });

  // 3. Solo Date Idea Endpoint
  app.post("/api/ai/solo-date-idea", async (_req: Request, res: Response) => {
    const fallbackSolo = {
      title: "Artisanal Pottery & Solo High Tea",
      description: "Book an afternoon wheel-throwing ceramic workshop, followed by gourmet pastries, loose-leaf tea, and quiet journaling."
    };

    if (!ai) {
      return res.json(fallbackSolo);
    }

    try {
      const prompt = "Suggest one creative and fulfilling solo date idea for someone focusing on self-love and independence. Return as JSON with 'title' and 'description'.";
      const response = await ai.models.generateContent({
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
      });

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
  });

  // 4. Discover Catchy Search Query Suggestions Endpoint
  app.post("/api/ai/discover-suggestions", async (req: Request, res: Response) => {
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

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

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
  });

  // 5. Discover Inspiring Date Ideas Endpoint
  app.post("/api/ai/discover-ideas", async (req: Request, res: Response) => {
    const { query = "", goals = [], events = [], location } = req.body || {};

    const fallbackItems = [
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
        title: "Kirstenbosch Summer Sunset Concerts",
        summary: "Sprawl out on the lush botanical lawns with a chilled bottle of MCC as live acoustic music echoes off the mountains.",
        category: "Entertainment",
        estimatedBudget: 750,
        imageSearchTerm: "botanical garden music lawn sunset",
        sourceName: "Sanbi Kirstenbosch",
        isAiGenerated: true,
      },
      {
        title: "Camps Bay Sunset Tidal Dip & Gelato",
        summary: "Stroll along Victoria Road at sunset, dip your feet in the ocean tidal pool, and share artisan handcrafted gelato.",
        category: "Casual & Sweet",
        estimatedBudget: 220,
        imageSearchTerm: "camps bay beach ocean sunset gelato",
        sourceName: "Atlantic Seaboard Strolls",
        isAiGenerated: true,
      },
      {
        title: "Drakensberg Mountain Chalet Retreat",
        summary: "A weekend escape surrounded by mist-covered amphitheater peaks, roaring log fires, and clear midnight stargazing.",
        category: "Getaways",
        estimatedBudget: 2800,
        imageSearchTerm: "mountain chalet log fireplace stars",
        sourceName: "Drakensberg Tourism",
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
      const locationContext = location
        ? `Approximate user coordinates: lat ${location.lat}, lng ${location.lng}. Prioritize nearby venues or South African highlights.`
        : "Focus on scenic South African romantic experiences and date night venues.";

      const prompt = `You are a romantic date concierge for a couple app in South Africa.
${goalsContext} ${eventsContext} ${locationContext}
Based on this context and search "${query || "unique romantic date ideas"}",
suggest 5 inspiring date ideas.
Return a JSON array of objects with fields:
- title (string): evocative title
- summary (string): 2-3 romantic sentences describing the experience
- category (string): e.g. "Dining", "Adventure", "Cozy", "Travel"
- estimatedBudget (number): estimated ZAR cost in Rand (e.g. 800)
- imageSearchTerm (string): search term for photo
- sourceName (string): venue or style suggestion
- isAiGenerated: true`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

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
  });

  // 6. Server-Sent Events (SSE) Streaming Endpoint
  app.post("/api/ai/stream", async (req: Request, res: Response) => {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

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
      const responseStream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: prompt
      });

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
  });

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

startServer();
