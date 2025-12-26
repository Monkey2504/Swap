
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Configuration du matcher pour le middleware.
 * On exclut explicitement les routes API critiques (Auth, Webhooks et notre Scanner de Roster)
 * pour éviter les redirections vers /login lors d'appels asynchrones sans session active.
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api/parse-roster (Route d'analyse IA des documents)
     * - api/auth (Routes d'authentification Supabase)
     * - api/webhooks
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico
     */
    '/((?!api/parse-roster|api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(req: NextRequest) {
  // Le matcher s'occupe de filtrer les appels. 
  // Les requêtes vers /api/parse-roster ne passent plus par ici, 
  // évitant ainsi le problème de redirection 307 vers /login en mode incognito.
  return NextResponse.next();
}
