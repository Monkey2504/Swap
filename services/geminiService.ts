
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";
import { STATION_CODES } from "../lib/stationCodes";

const ABBR_HINT = STATION_CODES.slice(0, 50).map(s => `${s.code}:${s.fr}`).join(', ');

const SYSTEM_PROMPT_PARSER = `Vous êtes l'Expert IA de Planification Ferroviaire au service d'une plateforme communautaire entre agents de bord.
Votre mission : Digitaliser un planning de service (ROSTER) avec une précision de 100%.

CONNAISSANCE DES CODES STATIONS :
Vous connaissez les codes de gares comme : ${ABBR_HINT}...
Si vous voyez un code de 2 à 4 lettres majuscules, c'est une gare.

STRUCTURE TYPIQUE DU DOCUMENT :
- Grille mensuelle ou liste.
- 'PS' = Prise de Service, 'FS' = Fin de Service.
- Les trajets sont souvent notés : "FBMZ - FLG" (Bruxelles-Midi vers Luik).

RÈGLES D'EXTRACTION :
1. ANALYSE : Identifiez chaque jour travaillé.
2. CODES TOURS : Ex: 702, 101, 905.
3. DESTINATIONS : Traduisez les codes télégraphiques en noms de gares complets.
4. FORMAT ISO : Dates en YYYY-MM-DD.`;

export async function parseRosterDocument(base64Data: string, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Digitalise ce planning. Utilise tes connaissances des codes télégraphiques ferroviaires pour identifier les destinations." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_PARSER,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 32768 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            services: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  date: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  type: { type: Type.STRING },
                  destinations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["code", "startTime", "endTime", "date"]
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"services": []}');
    return parsed.services || [];
  } catch (error) {
    console.error("Erreur d'analyse du roster:", error);
    throw error;
  }
}

export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
  if (offers.length === 0) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse et classe ces offres selon les goûts de l'agent :
      PREFS: ${JSON.stringify(preferences)}
      OFFRES: ${JSON.stringify(offers)}`,
      config: {
        systemInstruction: "Expert en ergonomie du travail ferroviaire. Calculez un score de compatibilité (0-100) basé sur les préférences de l'utilisateur.",
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
        matchReasons: m?.matchReasons || ["Analyse automatique"]
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Match Error:", error);
    return offers;
  }
}
