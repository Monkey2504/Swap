
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";

const SYSTEM_PROMPT_ROSTER = `Tu es l'agent IA de numérisation Roster pour la SNCB.
Ta mission est de lire un document de planning (PDF/Image) et de convertir chaque ligne de service en données structurées.

IDENTIFICATION DES SERVICES :
- Cherche les codes de tour (numéros de 3 à 6 chiffres).
- Identifie PS (Prise de Service) et FS (Fin de Service).
- Capture la date au format YYYY-MM-DD.
- Liste TOUTES les gares mentionnées dans l'itinéraire (champ destinations).
- Identifie le type de matériel ou service (IC, S, P, L, HKV, etc.).

RÈGLES D'EXTRACTION :
1. Chaque ligne du document doit être analysée.
2. Si une ligne n'est pas un service (Repos 'R', Congé 'C', Maladie 'M'), IGNORE-LA.
3. Le format de sortie doit être un JSON pur respectant strictement le schéma.
4. Assure-toi que start_time et end_time sont au format HH:mm.`;

const ROSTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    services: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "Numéro du tour/service" },
          date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
          start_time: { type: Type.STRING, description: "Heure de prise (PS)" },
          end_time: { type: Type.STRING, description: "Heure de fin (FS)" },
          type: { type: Type.STRING, description: "Catégorie (IC/S/P/L)" },
          destinations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste exhaustive des gares de l'itinéraire" }
        },
        required: ["code", "date", "start_time", "end_time"]
      }
    }
  }
};

export async function parseRosterDocument(base64Data: string, mimeType: string): Promise<Duty[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Content = base64Data.split(',')[1] || base64Data;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Content } },
          { text: "Extrais toutes les prestations SNCB de ce document." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_ROSTER,
        responseMimeType: "application/json",
        responseSchema: ROSTER_SCHEMA,
      }
    });

    if (!response.text) throw new Error("Document illisible par l'IA.");
    const data = JSON.parse(response.text);
    return (data.services || []) as Duty[];
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
  // Matching simple basé sur les types préférés
  return offers.map(offer => {
    const likes = preferences.filter(p => p.level === 'LIKE').map(p => p.value);
    const dislikes = preferences.filter(p => p.level === 'DISLIKE').map(p => p.value);
    
    let score = 50;
    if (likes.includes(offer.offeredDuty.type)) score += 30;
    if (dislikes.includes(offer.offeredDuty.type)) score -= 30;
    
    return {
      ...offer,
      matchScore: Math.max(0, Math.min(100, score)),
      matchReasons: ["Calculé via profil agent"]
    };
  });
}
