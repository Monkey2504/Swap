// src/middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 1. Initialisation : Crée la réponse qui sera modifiée par Supabase
  const res = NextResponse.next();
  
  // 2. Création du client Supabase pour le Middleware
  // Cette fonction gère l'actualisation des cookies de session.
  const supabase = createMiddlewareClient({ req, res });

  // 3. Rafraîchissement de la session
  // Ceci met à jour la session dans les cookies (si elle existe) ou la supprime (si elle est invalide).
  // C'est l'appel qui doit réussir pour que l'application fonctionne.
  await supabase.auth.getSession();

  // 4. Récupération de l'état de l'utilisateur APRÈS le rafraîchissement
  // Nous vérifions si l'utilisateur est authentifié pour gérer la redirection.
  const { data: { session } } = await supabase.auth.getSession();
  
  const loginUrl = new URL('/login', req.url);
  const profileUrl = new URL('/profile', req.url);

  // Vérifiez si l'utilisateur essaie d'accéder à une page protégée
  if (req.nextUrl.pathname.startsWith('/profile')) {
    if (!session) {
      // Si l'utilisateur n'est pas connecté et essaie d'accéder à /profile, rediriger vers /login
      return NextResponse.redirect(loginUrl);
    }
  }

  // Si l'utilisateur est déjà connecté et essaie d'accéder à /login, rediriger vers /profile (ou /dashboard)
  if (req.nextUrl.pathname === '/login') {
    if (session) {
      return NextResponse.redirect(profileUrl);
    }
  }

  // 5. Retourne la réponse (avec les cookies mis à jour si nécessaire)
  return res;
}

export const config = {
  // Le matcher doit lister les chemins que le middleware doit ignorer.
  // Nous excluons :
  // - Les dossiers Next.js internes (_next)
  // - Les fichiers statiques (favicon, images, etc.)
  // - TOUTES les routes API Sauf celles liées à l'authentification/webhooks Supabase.
  matcher: [
    // La route /api/parse-roster est désormais ignorée
    '/((?!api/parse-roster|api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};