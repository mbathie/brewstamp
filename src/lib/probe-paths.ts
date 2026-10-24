/*
 * Paths only a vulnerability scanner asks for. We serve no PHP, ASP or CGI,
 * and never expose dotfiles or credentials, but bots try thousands of these a
 * day — each one went through Next's not-found page and wrote a notfound log
 * line, burying real 404s. server.ts answers them with a bare 404 before
 * anything else runs.
 *
 * `/.well-known/*` is never a probe: app links and domain verification live
 * there.
 */
const PROBE_EXT = /\.(php\d?|phtml|asp|aspx|jsp|cgi|pl|env|ini|sql|bak|old|swp|log)$/i;
const PROBE_PREFIX = /^\/(wp-|wordpress\/|cgi-bin\/|phpmyadmin|pma\/|vendor\/|storage\/logs\/|\.(?!well-known\/))/i;
const PROBE_PART = /\/\.(git|svn|env|aws|ssh|npmrc|docker|vscode|config)(\/|$)/i;

export function isProbePath(pathname: string | null | undefined): boolean {
  if (!pathname || pathname.startsWith("/.well-known/")) return false;
  return PROBE_EXT.test(pathname) || PROBE_PREFIX.test(pathname) || PROBE_PART.test(pathname);
}
