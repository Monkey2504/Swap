
import type { NextApiRequest, NextApiResponse } from 'next';
// Fix: Corrected import to use 'parseRoster' as 'parseRosterOnServer' is not exported
import { parseRoster } from "../../services/geminiService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // Vérification de la clé API (Configuration Serveur)
  if (!process.env.API_KEY) {
    console.error("ERREUR CRITIQUE : API_KEY manquante dans les variables d'environnement.");
    return res.status(500).json({ error: 'Configuration serveur incomplète. Veuillez configurer API_KEY.' });
  }

  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Contenu du document manquant.' });
  }

  try {
    // Appel au service IA côté serveur
    // Fix: Updated function call to 'parseRoster' which is the correct exported member
    const services = await parseRoster(image, mimeType || 'image/jpeg');

    return res.status(200).json({ 
      success: true, 
      services 
    });

  } catch (error: any) {
    console.error("[API parse-roster] Error:", error);
    
    // Distinguer les types d'erreurs si possible
    const status = error.message?.includes('429') ? 429 : 500;
    const message = status === 429 
      ? "Quota IA dépassé. Veuillez réessayer dans quelques instants." 
      : (error.message || "Erreur lors de l'analyse du document.");

    return res.status(status).json({ 
      error: message,
      details: error.message 
    });
  }
}
