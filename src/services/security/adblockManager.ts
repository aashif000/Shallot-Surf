// src/services/security/adblockManager.ts
/**
 * adblockManager.ts
 *
 * Very small, pragmatic adblock filter engine:
 * - supports simple substring filters
 * - supports regex filters (prefix: "re:")
 * - supports loading remote or local lists (one pattern per line)
 *
 * NOTE: For robust blocking inside WebView you will later implement a native request interceptor (shouldInterceptRequest)
 * or use a WebView that exposes request hooks. This JS manager is for quick UI-level checks and link filtering.
 */

type Filter = { raw: string; isRegex: boolean; regex?: RegExp };

export const adblockManager = {
  filters: [] as Filter[],

  /**
   * loadFromString
   *  - Accepts a multi-line string (e.g., contents of EasyList-like file)
   */
  loadFromString(contents: string) {
    const lines = contents.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const filters: Filter[] = [];
    for (const line of lines) {
      if (line.startsWith('!') || line.startsWith('#')) continue; // comment
      if (line.startsWith('re:')) {
        try {
          const body = line.slice(3);
          const r = new RegExp(body);
          filters.push({ raw: line, isRegex: true, regex: r });
        } catch (e) {
          // ignore invalid regex
        }
      } else {
        filters.push({ raw: line, isRegex: false });
      }
    }
    this.filters = filters;
  },

  /**
   * loadFromUrl
   * - fetch list from remote URL (returns boolean for success)
   */
  async loadFromUrl(url: string): Promise<boolean> {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return false;
      const text = await resp.text();
      this.loadFromString(text);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * shouldBlock
   * - very small heuristic: check URL against filters
   */
  shouldBlock(url: string): boolean {
    const u = url.toLowerCase();
    for (const f of this.filters) {
      if (f.isRegex) {
        if (f.regex && f.regex.test(u)) return true;
      } else {
        // simple substring match
        if (u.includes(f.raw.toLowerCase())) return true;
      }
    }
    return false;
  },

  clear() {
    this.filters = [];
  },
};
