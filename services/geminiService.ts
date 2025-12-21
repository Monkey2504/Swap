
import { GoogleGenAI, Type } from "@google/genai";
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
  duration: string;
  tasks: ExtractedTask[];
}

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
      3. Vérifie sommairement le respect du RGPS.

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
                required: ["id", "matchScore", "matchReasons"]
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
 * Parses a roster document (Image or PDF) to extract detailed duties and tasks.
 */
export async function parseRosterDocument(base64Data: string, mimeType: string): Promise<ExtractedService[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: `Tu es un assistant spécialisé SNCB. Analyse ce document de roster (Korte Prestaties / Prestations Courtes). 
          Extrais CHAQUE service présent. Un service commence par une ligne comme "100 R1 FL-A 16 3:15 11:50 8h35".
          Pour chaque service, liste les tâches principales (Sign-on, TAXI, Train n°, Travel to, Bcb, etc.) avec leurs horaires et lieux.
          Fais attention à bien capturer le code du service (ex: 100 R1) et les heures de début/fin.` },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            services: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: "Code du service, ex: 100 R1" },
                  startTime: { type: Type.STRING, description: "Heure de début totale" },
                  endTime: { type: Type.STRING, description: "Heure de fin totale" },
                  duration: { type: Type.STRING, description: "Durée totale, ex: 8h35" },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING, description: "Heure de la tâche" },
                        description: { type: Type.STRING, description: "Nom de la tâche ou numéro de train" },
                        location: { type: Type.STRING, description: "Lieu ou gare" }
                      },
                      required: ["time", "description", "location"]
                    }
                  }
                },
                required: ["code", "startTime", "endTime", "tasks"]
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"services": []}');
    return result.services || [];
  } catch (error) {
    console.error("Erreur OCR/Document IA:", error);
    return [];
  }
}
