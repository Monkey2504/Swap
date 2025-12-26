// app/api/vision/route.js (Next.js 13+ App Router)
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(request) {
  try {
    // 1. Récupérer l'image depuis la requête
    const { image } = await request.json();
    if (!image) {
      return Response.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    // 2. Initialiser le client Google Cloud Vision
    const client = new ImageAnnotatorClient({
      key: process.env.GOOGLE_API_KEY, // OU avec service account
    });

    // 3. Analyser l'image
    const [result] = await client.textDetection({
      image: { content: image.split(',')[1] }, // Retirer le préfixe base64
    });

    // 4. Retourner le texte
    return Response.json({
      text: result.fullTextAnnotation?.text || '',
    });

  } catch (error) {
    console.error('Vision API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
