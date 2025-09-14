// src/services/search/engines.ts
export type SearchEngineKey = 'DuckDuckGo' | 'Google' | 'Bing' | 'Brave' | 'Custom';

export type SearchEngine = {
  name: SearchEngineKey;
  base: string; // base site
  queryUrl: string; // URL template with {query}
  suggestion?: string; // optional suggestion endpoint template
};

export const SEARCH_ENGINES: Record<SearchEngineKey, SearchEngine> = {
  DuckDuckGo: {
    name: 'DuckDuckGo',
    base: 'https://duckduckgo.com',
    queryUrl: 'https://duckduckgo.com/?q={query}',
    suggestion: 'https://ac.duckduckgo.com/ac/?q={query}&type=list',
  },
  Google: {
    name: 'Google',
    base: 'https://www.google.com',
    queryUrl: 'https://www.google.com/search?q={query}',
    suggestion: 'https://suggestqueries.google.com/complete/search?client=firefox&q={query}',
  },
  Bing: {
    name: 'Bing',
    base: 'https://www.bing.com',
    queryUrl: 'https://www.bing.com/search?q={query}',
    suggestion: 'https://api.bing.com/osjson.aspx?query={query}',
  },
  Brave: {
    name: 'Brave',
    base: 'https://search.brave.com',
    queryUrl: 'https://search.brave.com/search?q={query}',
  },
  Custom: {
    name: 'Custom',
    base: '',
    queryUrl: '{query}', // user-provided template expected
  },
};

/**
 * buildSearchUrl
 * - engine: key or a custom template (if 'Custom' supply customTemplate)
 * - q: user query
 * - customTemplate: e.g. 'https://example.com/search?q={query}'
 */
export function buildSearchUrl(
  engine: SearchEngineKey,
  q: string,
  customTemplate?: string,
): string {
  const raw = q.trim();
  // if looks like a URL, return as-is (prepends https if scheme missing)
  if (/^[a-zA-Z]+:\/\//.test(raw)) return raw;
  if (/\s/.test(raw) || !raw.includes('.')) {
    const encoded = encodeURIComponent(raw);
    const template = engine === 'Custom' && customTemplate ? customTemplate : SEARCH_ENGINES[engine].queryUrl;
    return template.replace('{query}', encoded);
  }
  // likely a bare domain or path
  if (!/^[a-zA-Z]+:\/\//.test(raw)) return `https://${raw}`;
  return raw;
}
