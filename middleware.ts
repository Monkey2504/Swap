import { NextResponse } from 'next/server';

/**
 * Le middleware Next.js s'exécute sur le Edge Runtime de Vercel.
 * Il doit obligatoirement retourner une instance de Response ou NextResponse.
 * Retourner 'null' ou 'undefined' provoque une erreur 500 CRITIQUE.
 */
export function middleware() {
  // On autorise simplement le passage de la requête vers la destination finale.
  return NextResponse.next();
}

export const config = {
  /*
   * Configuration du Matcher pour optimiser les performances :
   * On ignore les routes d'API (gérées par pages/api), 
   * les fichiers statiques de Next.js (_next/static),
   * et les images optimisées (_next/image).
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};