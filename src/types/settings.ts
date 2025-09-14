// src/types/settings.ts
export type TorBridgeType = 'none' | 'obfs4' | 'meek' | 'snowflake' | 'custom';
export type ProxyType = 'none' | 'socks5' | 'http' | 'custom';

export type SecurityLevel = 'standard' | 'safer' | 'safest';
export type SafeBrowsingLevel = 'standard' | 'enhanced' | 'none';
export type SearchEngine = 'DuckDuckGo' | 'Google' | 'Bing' | 'Brave' | 'Custom';

export type SettingsState = {
  // Tor / connection
  torEnabled: boolean;
  torBridge: TorBridgeType;
  torBridgeCustom?: string;
  proxyType: ProxyType;
  proxyHost?: string;
  proxyPort?: string;

  // Security levels
  securityLevel: SecurityLevel;
  javascriptEnabled: boolean;
  cookiesEnabled: boolean;
  firstPartyIsolation: boolean;
  clearOnExit: boolean;
  httpsOnly: boolean;

  // Fingerprint protections
  uniformUserAgent: boolean;
  disableWebGL: boolean;
  disableCanvas: boolean;
  disableMediaEnumeration: boolean;

  // Search
  defaultSearchEngine: SearchEngine;
  searchSuggestions: boolean;
  customSearchEngineUrl?: string;

  // Chrome-like
  homepageEnabled: boolean;
  homepageUrl?: string;
  autofillEnabled: boolean;
  passwordManagerEnabled: boolean;
  translateEnabled: boolean;
  incognitoEnabled: boolean;
  doNotTrack: boolean;
  safeBrowsing: SafeBrowsingLevel;
  liteMode: boolean;
  preloadPages: boolean;
  textScale: number; // percent, 100 default
  forceDarkMode: boolean;

  // Advanced
  downloadsLocation?: string;
  syncEnabled: boolean;
  experimentalFlags: Record<string, boolean>;
};

export const DEFAULT_SETTINGS: SettingsState = {
  torEnabled: false,
  torBridge: 'none',
  proxyType: 'none',
  proxyHost: undefined,
  proxyPort: undefined,

  securityLevel: 'standard',
  javascriptEnabled: true,
  cookiesEnabled: true,
  firstPartyIsolation: false,
  clearOnExit: false,
  httpsOnly: true,

  uniformUserAgent: false,
  disableWebGL: false,
  disableCanvas: false,
  disableMediaEnumeration: false,

  defaultSearchEngine: 'DuckDuckGo',
  searchSuggestions: true,
  customSearchEngineUrl: undefined,

  homepageEnabled: false,
  homepageUrl: undefined,
  autofillEnabled: false,
  passwordManagerEnabled: false,
  translateEnabled: false,
  incognitoEnabled: false,
  doNotTrack: false,
  safeBrowsing: 'standard',

  liteMode: false,
  preloadPages: false,
  textScale: 100,
  forceDarkMode: false,

  downloadsLocation: undefined,
  syncEnabled: false,
  experimentalFlags: {},
};
