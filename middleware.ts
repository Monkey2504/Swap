import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Configuration du matcher pour le middleware.
 * On exclut explicitement les routes API critiques pour éviter les redirections vers /login
 * lors d'appels asynchrones ou en mode navigation privée (incognito).
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf celles définies ci-dessous :
     * - api/parse-roster (Analyse IA des plannings)
     * - api/auth (Supabase Auth)
     * - api/webhooks
     * - _next/static, _next/image, favicon.ico
     */
    '/((?!api/parse-roster|api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(req: NextRequest) {
  // TEST 1 (Désactivation temporaire) : 
  // On laisse passer toutes les requêtes matchées pour isoler si l'erreur 
  // MIDDLEWARE_INVOCATION_FAILED provient de la logique interne (cookies/session).
  return NextResponse.next();
}