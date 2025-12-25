
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";

const SYSTEM_PROMPT_ROSTER = `Tu es un expert en logistique ferroviaire SNCB. 
Extraire TOUTES les prestations de service présentes dans le document (Image ou PDF).
Pour chaque prestation, retourne un objet JSON avec :
- code: le numéro de tour ou de série (ex: 123, 456...)
- date: la date du service au format YYYY-MM-DD
- start_time: heure de prise de service (notée PS) au format HH:mm
- end_time: heure de fin de service (notée FS) au format HH:mm
- type: IC, L, S, P ou Omnibus
- destinations: liste des gares de passage ou terminus.

CONSIGNES STRICTES :
1. Ignore les jours de repos (R), maladies (M), et congés.
2. Le format de sortie doit être EXCLUSIVEMENT du JSON conforme au schéma.
3. Utilise impérativement les noms de champs start_time et end_time (snake_case).`;

const ROSTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    services: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          date: { type: Type.STRING },
          start_time: { type: Type.STRING },
          end_time: { type: Type.STRING },
          type: { type: Type.STRING },
          destinations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["code", "date", "start_time", "end_time"]
      }
    }
  }
};

export async function parseRosterDocument(base64Data: string, mimeType: string): Promise<Duty[]> {
  // Initialisation à l'intérieur de la fonction comme requis
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Content = base64Data.split(',')[1] || base64Data;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Content
            }
          },
          { text: "Analyse ce planning SNCB et liste les services au format JSON." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_ROSTER,
        responseMimeType: "application/json",
        responseSchema: ROSTER_SCHEMA,
      }
    });

    if (!response.text) {
      throw new Error("L'IA n'a renvoyé aucun résultat. Vérifiez la qualité du document.");
    }

    const data = JSON.parse(response.text);
    return (data.services || []) as Duty[];
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
  return offers.map(offer => {
    const hasLikeType = preferences.some(p => p.category === 'content' && p.level === 'LIKE' && p.value === offer.offeredDuty.type);
    const hasDislikeType = preferences.some(p => p.category === 'content' && p.level === 'DISLIKE' && p.value === offer.offeredDuty.type);
    
    let score = 50;
    if (hasLikeType) score += 30;
    if (hasDislikeType) score -= 30;
    
    return {
      ...offer,
      matchScore: Math.max(0, Math.min(100, score)),
      matchReasons: ["Calculé par SwapACT Core"]
    };
  });
}
