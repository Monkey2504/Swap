
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";

export interface ExtractedTask {
  time: string;
  description: string;
  location: string;
}

export interface ExtractedService {
  code: string;
  startTime: string;
  endTime: string;
  duration?: string;
  tasks: ExtractedTask[];
}

const SWAP_SYSTEM_INSTRUCTION = `
You are a senior rail operations coordinator for SNCB. Your role is to analyze and match train crew (ACT) service swaps.
BUSINESS RULES:
- IC (InterCity), Omnibus/L, P (Rush hour), S (Suburban).
- AM96, M6, M7, Desiro are rolling stock types.
- RGPS compliance is mandatory (Rest time, service duration).
- User preferences use LIKE/DISLIKE/NEUTRAL and priority levels.
- Output MUST be strictly JSON.
`;

export async function matchSwaps(
  userPreferences: UserPreference[],
  availableDuties: SwapOffer[]
): Promise<SwapOffer[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Match these preferences with the available offers: 
      PREFS: ${JSON.stringify(userPreferences)}
      OFFERS: ${JSON.stringify(availableDuties)}`,
      config: {
        systemInstruction: SWAP_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER },
                  matchReasons: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "matchScore", "matchReasons"]
              }
            }
          },
          required: ["matches"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches": []}');
    
    return availableDuties.map(duty => {
      const aiMatch = result.matches?.find((m: any) => m.id === duty.id);
      return {
        ...duty,
        matchScore: aiMatch?.matchScore || 0,
        matchReasons: aiMatch?.matchReasons || ["Analyse en cours"]
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("[CRITICAL] Gemini Match Error:", error);
    return availableDuties;
  }
}

export async function parseRosterDocument(base64Data: string, mimeType: string): Promise<ExtractedService[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Extract ALL duties from this SNCB roster. Use telegraphic codes for locations if present (e.g. FBMZ, FNR, FLG). Be exhaustive and extract every single service code found on the page." }
        ]
      },
      config: {
        systemInstruction: "You are a professional SNCB roster parser. You recognize telegraphic station codes (3-5 letters like FBMZ for Brussels-Midi, FNR for Namur, etc.). Extract services with their start/end times and all station stops listed.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            services: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        description: { type: Type.STRING },
                        location: { type: Type.STRING }
                      },
                      required: ["time", "description", "location"]
                    }
                  }
                },
                required: ["code", "startTime", "endTime", "tasks"]
              }
            }
          },
          required: ["services"]
        }
      }
    });

    return JSON.parse(response.text || '{"services": []}').services || [];
  } catch (error) {
    console.error("[CRITICAL] OCR Failure:", error);
    return [];
  }
}
