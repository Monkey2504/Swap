
import type { NextApiRequest, NextApiResponse } from 'next';
import { parseRosterOnServer } from "../../services/geminiService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // Vérification de la clé API sur le serveur
  if (!process.env.API_KEY) {
    console.error("API_KEY manquante sur le serveur");
    return res.status(500).json({ error: 'Configuration serveur incomplète (Clé API manquante).' });
  }

  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Le contenu du document (image/base64) est requis.' });
  }

  try {
    const services = await parseRosterOnServer(image, mimeType || 'image/jpeg');

    return res.status(200).json({ 
      success: true, 
      services 
    });

  } catch (error: any) {
    console.error("[API parse-roster] Fatal Error:", error);
    return res.status(500).json({ 
      error: 'Échec de l\'analyse par l\'IA Cloud SNCB',
      details: error.message 
    });
  }
}
