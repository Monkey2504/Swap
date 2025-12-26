import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Étape 16 : Diagnostic de l'erreur MIDDLEWARE_INVOCATION_FAILED
 * Nous simplifions le middleware au maximum pour vérifier si le crash 
 * est dû à l'exécution même du middleware sur l'infrastructure Vercel.
 */
export const config = {
  /**
   * Le matcher exclut les assets et l'auth pour tester la stabilité sur les autres routes.
   */
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'], 
};

export async function middleware(req: NextRequest) {
  /**
   * Retourne le contrôle immédiatement sans aucune logique Supabase ou cookie.
   * Cette version "vierge" permet de confirmer la validité de l'environnement d'exécution.
   */
  return NextResponse.next(); 
}