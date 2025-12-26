import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Duty, UserPreference, SwapOffer } from "../types";

const SYSTEM_PROMPT_ROSTER = `Tu es l'agent IA expert de la SNCB. Ton rôle est d'analyser les documents de planification (Rosters).
RÈGLES D'EXTRACTION :
1. Extrais uniquement les prestations de service réelles (tours).
2. Ignore les repos (R, RU, RX), congés (C, CA), maladie (M), formations ou jours blancs.
3. Pour la date, utilise le format YYYY-MM-DD. Si l'année n'est pas précisée, assume 2024.
4. Formate les heures de PS (prise de service / start_time) et de FS (fin de service / end_time) au format 24h (HH:mm).
5. Identifie le type de train (IC, L, S, P, HKV, Omnibus).
6. Identifie le code du tour (généralement un nombre de 3 ou 4 chiffres).
7. Liste les gares principales de l'itinéraire dans "destinations" (liste de chaînes de caractères uniquement).
FORMAT DE SORTIE : JSON strict uniquement.`;

const ROSTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    services: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "Numéro de tour (ex: 405)" },
          date: { type: Type.STRING, description: "Date (YYYY-MM-DD)" },
          start_time: { type: Type.STRING, description: "Heure de prise (HH:mm)" },
          end_time: { type: Type.STRING, description: "Heure de fin (HH:mm)" },
          type: { type: Type.STRING, description: "Type de train (IC, L, S, P)" },
          destinations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Gares principales" }
        },
        required: ["code", "date", "start_time", "end_time"]
      }
    }
  }
};

/**
 * Analyse du document Roster (Utilisé directement côté client pour éviter les problèmes de routes API)
 */
export async function parseRoster(base64Data: string, mimeType: string): Promise<Duty[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Content = base64Data.includes('base64,') ? base64Data.split(',')[1] : base64Data;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Content } },
          { text: "Analyse ce roster SNCB et extrais les prestations de service." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_ROSTER,
        responseMimeType: "application/json",
        responseSchema: ROSTER_SCHEMA,
      }
    });

    const text = response.text;
    if (!text) throw new Error("L'IA n'a pas pu extraire de texte du document.");
    
    const data = JSON.parse(text);
    const services = (data.services || []) as any[];

    // Sanétisation stricte pour éviter l'erreur React #31
    return services.map(s => ({
      ...s,
      code: String(s.code || ''),
      type: String(s.type || 'SNCB'),
      destinations: Array.isArray(s.destinations) 
        ? s.destinations.map((d: any) => typeof d === 'string' ? d : JSON.stringify(d)) 
        : []
    })) as Duty[];
  } catch (error: any) {
    console.error("[geminiService] Extraction Error:", error);
    throw new Error(error.message || "Erreur de traitement IA lors de la lecture du document.");
  }
}

/**
 * Calcul du matching intelligent pour la bourse aux échanges.
 */
export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]): Promise<SwapOffer[]> {
  if (offers.length === 0) return [];
  
  return offers.map(offer => {
    const likes = preferences.filter(p => p.level === 'LIKE').map(p => p.value);
    const dislikes = preferences.filter(p => p.level === 'DISLIKE').map(p => p.value);
    
    let score = 70; // Score de base
    if (likes.includes(offer.offeredDuty.type)) score += 20;
    if (dislikes.includes(offer.offeredDuty.type)) score -= 40;
    
    return {
      ...offer,
      matchScore: Math.max(5, Math.min(99, score)),
      matchReasons: score > 75 ? ["Idéal pour votre profil", "Type de train favori"] : ["Offre standard"]
    };
  });
}