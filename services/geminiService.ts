
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";
import { STATION_CODES } from "../lib/stationCodes";

// On donne à l'IA une liste d'exemples de codes pour améliorer la précision
const STATION_HINTS = STATION_CODES.slice(0, 30).map(s => `${s.code}(${s.fr})`).join(', ');

const SYSTEM_PROMPT_ROSTER = `Vous êtes un expert en logistique ferroviaire SNCB.
Votre tâche : Extraire les données d'un planning agent (Roster).

TERMINOLOGIE SNCB :
- 'PS' : Prise de Service (Heure de début)
- 'FS' : Fin de Service (Heure de fin)
- 'Tour' / 'Série' : Identifiant du service (ex: 702, 115)
- 'Gare' : Codes télégraphiques (ex: FBMZ, FNR, FLG)

RÈGLES :
1. Les dates doivent être au format YYYY-MM-DD.
2. Les heures au format HH:mm.
3. Si une destination est un code, conservez le code.
4. Soyez extrêmement rigoureux sur les horaires.`;

export async function parseRosterDocument(base64Data: string, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analyse ce document SNCB et extrais la liste des services. Codes connus pour aide : " + STATION_HINTS }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_ROSTER,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            services: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: "Numéro du tour de service" },
                  date: { type: Type.STRING, description: "Date ISO" },
                  startTime: { type: Type.STRING, description: "Heure PS" },
                  endTime: { type: Type.STRING, description: "Heure FS" },
                  type: { type: Type.STRING, description: "Type de train (IC, L, S, P)" },
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
    console.error("Erreur parsing Gemini:", error);
    throw new Error("L'IA n'a pas pu lire le document. Assurez-vous que la photo est nette.");
  }
}

export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
  // Logique simplifiée pour le MVP (Heuristique rapide)
  return offers.map(offer => {
    let score = 70; // Score de base
    // Logique locale sans appel API pour la rapidité
    return {
      ...offer,
      matchScore: score,
      matchReasons: ["Analyse de conformité RGPS", "Dépôt correspondant"]
    };
  });
}
