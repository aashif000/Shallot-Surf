// src/services/security/doh.ts
/**
 * DNS over HTTPS helper functions.
 * Pure JS wrapper that uses public DoH endpoints.
 *
 * Example usage:
 *  const ips = await resolveDoH('example.com');
 */

const CLOUDFLARE_JSON = 'https://cloudflare-dns.com/dns-query?name={name}&type=A';
const GOOGLE_JSON = 'https://dns.google/resolve?name={name}&type=A';

export async function resolveDoH(name: string, provider: 'cloudflare' | 'google' = 'cloudflare', timeoutMs = 8000): Promise<string[]> {
  const url = (provider === 'cloudflare' ? CLOUDFLARE_JSON : GOOGLE_JSON).replace('{name}', encodeURIComponent(name));
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/dns-json' } });
    clearTimeout(id);
    if (!resp.ok) throw new Error(`DoH ${resp.status}`);
    const json = await resp.json();
    // different provider shapes: google uses Answer array, cloudflare uses Answer too (in dns-json mode)
    const answers = Array.isArray(json.Answer) ? json.Answer : json.Answers ?? json.Answers;
    if (!answers) return [];
    const ips: string[] = answers
      .filter((a: any) => a.type === 1 || a.data) // A records
      .map((a: any) => (a.data ? a.data : a.rdata))
      .filter(Boolean);
    return ips;
  } catch (e) {
    return [];
  }
}
