import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export const GEMINI_MODEL = "gemini-2.5-flash";

export function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } else {
      console.warn("GEMINI_API_KEY environment variable is not configured correctly. Using fallback simulator.");
    }
  }
  return aiClient;
}
