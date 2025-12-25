
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";
import { STATION_CODES } from "../lib/stationCodes";

// Aide à l'IA avec les codes gares pour augmenter la précision du mapping
const STATION_HINTS = STATION_CODES.slice(0, 50).map(s => `${s.code}(${s.fr})`).join(', ');

const SYSTEM_PROMPT_ROSTER = `Vous êtes un expert en lecture de documents ferroviaires SNCB. 
Votre mission est d'extraire les services (prestations) depuis une image ou un PDF de planning (roster).

RÈGLES D'EXTRACTION :
1. Identifiez le numéro de 'Tour' ou 'Série' (souvent un nombre de 3 chiffres).
2. 'PS' ou 'Prise de service' -> startTime (HH:mm).
3. 'FS' ou 'Fin de service' -> endTime (HH:mm).
4. La date doit être au format ISO YYYY-MM-DD.
5. Les destinations sont les codes télégraphiques (ex: FBMZ, FNR). 
6. Le type de train est souvent indiqué par IC, L, S, P ou l'abréviation du matériel.

IMPORTANT : 
- Ignorez les lignes de repos (R) ou de maladie (M).
- Si plusieurs jours sont visibles, extrayez tous les services.
- Si une heure traverse minuit, assurez-vous de bien capturer startTime et endTime.`;

export async function parseRosterDocument(base64Data: string, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Nettoyage de la chaîne base64 (on retire le prefixe data:application/pdf;base64, si présent)
  const cleanBase64 = base64Data.includes('base64,') 
    ? base64Data.split('base64,')[1] 
    : base64Data;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "Extrais la liste des prestations de ce planning. Aide codes gares : " + STATION_HINTS }
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
                  code: { type: Type.STRING, description: "Numéro de tour" },
                  date: { type: Type.STRING, description: "Date YYYY-MM-DD" },
                  startTime: { type: Type.STRING, description: "PS HH:mm" },
                  endTime: { type: Type.STRING, description: "FS HH:mm" },
                  type: { type: Type.STRING, description: "Type (IC, L, S, P)" },
                  destinations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["code", "startTime", "endTime", "date"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA");
    
    const parsed = JSON.parse(text);
    return parsed.services || [];
  } catch (error) {
    console.error("Erreur Gemini Service:", error);
    throw new Error("Échec de la lecture du document. Vérifiez la netteté du fichier.");
  }
}

export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
  // Simule un matching basé sur les préférences (score entre 0 et 100)
  return offers.map(offer => {
    let score = 50;
    // Logique simplifiée pour le retour visuel
    return {
      ...offer,
      matchScore: score,
      matchReasons: ["Analyse RGPS effectuée", "Dépôt compatible"]
    };
  });
}
