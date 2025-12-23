
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPreference, Duty, SwapOffer } from "../types";

const SYSTEM_PROMPT_PARSER = `Vous êtes un expert en planification ferroviaire SNCB (Société Nationale des Chemins de fer Belges).
Votre mission est d'extraire les services de conduite ou d'accompagnement (ACT) à partir de photos de rosters papier ou de fichiers PDF.

CONSIGNES DE PRÉCISION :
1. DÉTECTION DES DATES : Identifiez la date spécifique pour chaque prestation. Si le document est une grille mensuelle, calculez la date exacte.
2. CODES DE SERVICE : Extrayez le code tour (ex: 702, 101, 7401).
3. HORAIRES : Capturez précisément la Prise de Service (PS) et la Fin de Service (FS).
4. RELATIONS ET MISSIONS : Listez les gares desservies (ex: FBMZ, FNR, FGSP) et les numéros de trains si visibles.
5. TYPE DE TRAIN : Déduisez le type (IC, L, S, P) selon la numérotation ou la description.
6. LANGUES : Gérez les documents en Français ou Néerlandais (ex: 'Rijpad', 'Prestatie').

Structurez toujours en JSON valide.`;

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
          { text: "Analyse ce planning SNCB avec une précision maximale. Extrais chaque jour de travail détecté comme une prestation séparée." }
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
                  code: { type: Type.STRING, description: "Code du tour de service" },
                  date: { type: Type.STRING, description: "Date au format YYYY-MM-DD" },
                  startTime: { type: Type.STRING, description: "Heure de début (HH:mm)" },
                  endTime: { type: Type.STRING, description: "Heure de fin (HH:mm)" },
                  type: { type: Type.STRING, enum: ['IC', 'L', 'P', 'S', 'Omnibus'] },
                  destinations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Villes ou gares principales desservies" },
                  notes: { type: Type.STRING, description: "Informations complémentaires (ex: coupure, réserve)" }
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
    console.error("OCR/Parsing Error:", error);
    throw error;
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
        matchReasons: m?.matchReasons || ["Analyse heuristique standard"]
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Match Error:", error);
    return offers;
  }
}
