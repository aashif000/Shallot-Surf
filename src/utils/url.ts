// src/utils/url.ts
/**
 * URL helpers
 * - normalizeToUrl(raw): returns a URL string (search -> search engine, host -> https://host)
 * - isProbablyUrl(raw): heuristic to detect URLs vs search queries
 * - stripProtocol(url): remove leading protocol for display
 */

export function isProbablyUrl(raw: string): boolean {
  if (!raw) return false;
  const t = raw.trim();
  // contains spaces => likely a search
  if (/\s/.test(t)) return false;
  // has protocol
  if (/^[a-zA-Z]+:\/\//.test(t)) return true;
  // has dot and not leading/trailing dot
  if (/\./.test(t) && !/^\./.test(t) && !/\.$/.test(t)) return true;
  // IP address
  if (/^\d{1,3}(\.\d{1,3}){3}/.test(t)) return true;
  return false;
}

export function normalizeToUrl(raw: string, defaultEngine = 'https://duckduckgo.com/?q={query}'): string {
  const s = (raw ?? '').trim();
  if (!s) return 'about:blank';
  if (isProbablyUrl(s)) {
    if (/^[a-zA-Z]+:\/\//.test(s)) return s;
    return `https://${s}`;
  }
  // treat as search
  const q = encodeURIComponent(s);
  return defaultEngine.replace('{query}', q);
}

export function stripProtocol(url: string): string {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '');
}

export function ensureTrailingSlash(url: string): string {
  try {
    const u = new URL(url);
    if (!u.pathname || u.pathname === '') u.pathname = '/';
    return u.toString();
  } catch {
    return url;
  }
}
