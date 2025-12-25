
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Schéma de réponse aligné sur la base de données Supabase (snake_case)
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
          start_time: { type: Type.STRING }, // Heure de début
          end_time: { type: Type.STRING },   // Heure de fin
          type: { type: Type.STRING },
          destinations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["code", "date", "start_time", "end_time"]
      }
    }
  }
};

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
3. Utilise impérativement les noms de champs start_time et end_time.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { base64Data, mimeType } = req.body;

  if (!base64Data || !mimeType) {
    return res.status(400).json({ message: 'Données manquantes (base64Data ou mimeType)' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Content = base64Data.split(',')[1] || base64Data;

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
      },
    });

    if (!response.text) {
      return res.status(500).json({ message: "L'IA n'a renvoyé aucun résultat textuel." });
    }

    const data = JSON.parse(response.text);
    return res.status(200).json({ services: data.services || [] });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ 
      message: "Échec de l'analyse IA serveur.", 
      details: error.message 
    });
  }
}
