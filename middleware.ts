import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware minimaliste. 
 * Retourner NextResponse.next() est impératif pour éviter l'erreur 500.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // On n'applique le middleware qu'aux routes de l'application, en ignorant les assets statiques
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};