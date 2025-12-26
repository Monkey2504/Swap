// Le middleware est désactivé pour éviter les erreurs MIDDLEWARE_INVOCATION_FAILED
// dans les environnements de prévisualisation qui ne supportent pas les fonctions Edge.
export const config = {
  matcher: [],
};

export async function middleware() {
  return null;
}
