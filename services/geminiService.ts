
import { UserPreference, Duty, SwapOffer } from "../types";

/**
 * Envoie le document à la route API sécurisée pour extraction.
 */
export async function parseRosterDocument(base64Data: string, mimeType: string): Promise<Duty[]> {
  try {
    const response = await fetch('/api/parse-roster', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Data, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de l'analyse du Roster.");
    }

    const { services } = await response.json();
    return services as Duty[];
  } catch (error) {
    console.error("[geminiService] Fetch Error:", error);
    throw error;
  }
}

/**
 * Calcule le score de matching entre préférences utilisateur et offres d'échange.
 */
export async function matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
  return offers.map(offer => {
    // On se base sur le type de train (IC, L, P...)
    const hasLikeType = preferences.some(p => p.category === 'content' && p.level === 'LIKE' && p.value === offer.offeredDuty.type);
    const hasDislikeType = preferences.some(p => p.category === 'content' && p.level === 'DISLIKE' && p.value === offer.offeredDuty.type);
    
    let score = 50;
    if (hasLikeType) score += 30;
    if (hasDislikeType) score -= 30;
    
    // On pourrait ajouter d'autres critères ici (station_time, etc.)
    
    return {
      ...offer,
      matchScore: Math.max(0, Math.min(100, score)),
      matchReasons: ["Score IA basé sur vos préférences types"]
    };
  });
}
