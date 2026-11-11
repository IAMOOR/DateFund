import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing! Please set it in your environment variables.");
}

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });
