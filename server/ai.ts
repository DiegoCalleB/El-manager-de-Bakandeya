import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.6-flash";

export const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
];

let cachedClient: { key: string; client: GoogleGenAI } | null = null;

export function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  if (cachedClient && cachedClient.key === apiKey) {
    return cachedClient.client;
  }

  const client = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  cachedClient = { key: apiKey, client };
  return client;
}

export async function generateContentWithFallback(
  client: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = params.preferredModel 
    ? [params.preferredModel, ...FALLBACK_MODELS.filter(m => m !== params.preferredModel)]
    : FALLBACK_MODELS;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini API] Intentando modelo: ${modelName}...`);
      const response = await client.models.generateContent({
        model: modelName,
        contents: params.contents,
        ...(params.config ? { config: params.config } : {})
      });
      if (response) {
        console.log(`[Gemini API] ¡Éxito con modelo: ${modelName}!`);
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Falló modelo '${modelName}': ${err.message || err}`);
    }
  }

  throw lastError;
}

