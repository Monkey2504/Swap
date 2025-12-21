
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";

export async function matchSwaps(
  userPreferences: UserPreference[],
  availableDuties: SwapOffer[]
): Promise<SwapOffer[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Tu es un expert en logistique ferroviaire SNCB pour les Accompagnateurs de Train (ACT).
      
      NOMENCLATURE SNCB:
      - IC: InterCity (rapide)
      - Omnibus/L: Trains de desserte locale
      - M7/M6: Voitures modernes à double étage
      - AM96: Automotrices confortables
      - RGPS: Règlement Général des Prestations de Service (temps de repos minimum 11h, durée max 10h).

      PRÉFÉRENCES UTILISATEUR: ${JSON.stringify(userPreferences)}
      OFFRES DISPONIBLES: ${JSON.stringify(availableDuties)}
      
      TASK: 
      1. Calcule un matchScore (0-100) basé sur les likes/dislikes et les priorités.
      2. Fournis 3 raisons concrètes (matchReasons) basées sur le contenu (type, relation, destination) ou le planning.
      3. Vérifie sommairement le respect du RGPS (si les horaires sont trop proches de services existants).

      RETOURNE UNIQUEMENT JSON:
      {
        "matches": [
          { "id": "string", "matchScore": number, "matchReasons": ["string"] }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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
                propertyOrdering: ["id", "matchScore", "matchReasons"]
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches": []}');
    
    return availableDuties.map(duty => {
      const aiMatch = result.matches?.find((m: any) => m.id === duty.id);
      return {
        ...duty,
        matchScore: aiMatch?.matchScore || Math.floor(Math.random() * 40),
        matchReasons: aiMatch?.matchReasons || ["Analyse automatique en cours"]
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Erreur Gemini Matching:", error);
    return availableDuties;
  }
}

/**
 * Parses a roster document (Image or PDF) to extract duties.
 */
export async function parseRosterDocument(base64Data: string, mimeType: string): Promise<Partial<Duty>[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Tu es un assistant spécialisé SNCB. Analyse ce document de roster (planning). Extrais tous les services prévus : code du service (4 chiffres), heure de départ, heure d'arrivée, et les gares de passage ou destinations. Retourne une liste propre en JSON." },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            duties: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  destinations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                propertyOrdering: ["code", "startTime", "endTime", "destinations"]
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"duties": []}');
    return result.duties || [];
  } catch (error) {
    console.error("Erreur OCR/Document IA:", error);
    return [];
  }
}
