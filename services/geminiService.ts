
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";

const SYSTEM_PROMPT_PARSER = `Vous êtes un expert en planification ferroviaire SNCB. 
Votre mission est d'extraire les services d'accompagnement (ACT) ou de conduite à partir de documents ou photos.
RÈGLES :
- Identifiez les codes de service (ex: 702, 101).
- Identifiez les lieux via codes télégraphiques (FBMZ = Midi, FNR = Namur).
- Extrayez précisément les heures de début et de fin.
- Structurez toujours en JSON valide.`;

const SYSTEM_PROMPT_MATCHER = `Expert en gestion RH SNCB. 
Évaluez la pertinence d'un échange de service entre deux agents.
Considérez les types de trains (IC, L, S, P), les horaires, et les priorités de l'utilisateur.
Le score de match (0-100) doit refléter la satisfaction probable de l'utilisateur.`;

export async function parseRosterDocument(base64Data: string, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analyse ce roster SNCB et extrait tous les services détectés avec leurs horaires et arrêts." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_PARSER,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 },
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
                  type: { type: Type.STRING, enum: ['IC', 'L', 'P', 'S', 'Omnibus'] },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        location: { type: Type.STRING },
                        description: { type: Type.STRING }
                      }
                    }
                  }
                },
                required: ["code", "startTime", "endTime"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"services": []}').services;
  } catch (error) {
    console.error("OCR Error:", error);
    return [];
  }
}

export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
  if (offers.length === 0) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Compare ces préférences avec les offres d'échanges disponibles :
      PREFS: ${JSON.stringify(preferences)}
      OFFRES: ${JSON.stringify(offers)}`,
      config: {
        systemInstruction: SYSTEM_PROMPT_MATCHER,
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
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches": []}');
    return offers.map(offer => {
      const m = result.matches?.find((m: any) => m.id === offer.id);
      return {
        ...offer,
        matchScore: m?.matchScore || 50,
        matchReasons: m?.matchReasons || ["Calcul en cours"]
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Match Error:", error);
    return offers;
  }
}
