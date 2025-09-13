// src/components/Browser/SecureWebView.tsx
import { ENABLE_NATIVE_COOKIE_CLEAR } from '@/config/env';
import { on as onEvent } from '@/services/events';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';

/**
 * SecureWebView wrapper
 *
 * - Exposes a typed handle with reload/goBack/goForward/injectJavaScript/clearData
 * - clearData() attempts:
 *   1) JS clearing: localStorage, sessionStorage, indexedDB
 *   2) Native cookie clearing via @react-native-cookies/cookies (if available)
 *   3) WebView cache clearing (if available)
 *   4) reload the webview
 * - Added per-origin JavaScript control via perOriginJS prop
 *
 * The require for '@react-native-cookies/cookies' is dynamic - the bundle will run
 * even if that native dependency is not installed. If you want native cookie clearing,
 * install @react-native-cookies/cookies and rebuild the app.
 */

export type SecureWebViewHandle = {
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  injectJavaScript: (js: string) => void;
  clearData: () => Promise<void>;
};

type SecureWebViewProps = {
  uri: string;
  incognito?: boolean;
  injectedJavaScript?: string;
  perOriginJS?: Record<string, boolean>; // key = hostname
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (e: any) => void;
  style?: any;
};

const SecureWebView = forwardRef<SecureWebViewHandle, SecureWebViewProps>(
  ({ uri, perOriginJS, incognito, injectedJavaScript, onLoadStart, onLoadEnd, onError, style }, ref) => {

    const webviewRef = useRef<WebView | null>(null);
    const [jsEnabled, setJsEnabled] = useState(true);

    // Determine JavaScript enabled status based on perOriginJS rules
    useEffect(() => {
      try {
        const hostname = new URL(uri).hostname;
        if (perOriginJS && hostname in perOriginJS) {
          setJsEnabled(perOriginJS[hostname]);
        } else {
          setJsEnabled(true); // default
        }
      } catch {
        setJsEnabled(true); // fallback if URL parsing fails
      }
    }, [uri, perOriginJS]);

    // Try to dynamically load cookie manager - safe if not installed
    let CookieManager: any = null;

    if (ENABLE_NATIVE_COOKIE_CLEAR) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const mod = require('@react-native-cookies/cookies');
        CookieManager = mod?.default ?? mod;
      } catch (e) {
        CookieManager = null;
        console.warn('Native cookie manager not available', e);
      }
    } else {
      CookieManager = null;
    }
    
    // Best-effort clearData implementation
    const clearData = async (): Promise<void> => {
      try {
        // 1) JS world clearing: localStorage, sessionStorage, indexedDB
        const jsClear = `
          (function(){
            try {
              if (window.localStorage) try { localStorage.clear(); } catch(e){}
              if (window.sessionStorage) try { sessionStorage.clear(); } catch(e){}
              if (window.indexedDB && indexedDB.databases) {
                indexedDB.databases().then(dbs => {
                  dbs.forEach(db => {
                    try { indexedDB.deleteDatabase(db.name); } catch(e){}
                  });
                }).catch(()=>{});
              }
            } catch(e){}
            true;
          })();
        `;
        webviewRef.current?.injectJavaScript?.(jsClear);

        // 2) Native cookie clearing - best effort, may require native dependency
        if (CookieManager) {
          try {
            // API differs slightly across versions; try clearAll then fallback to clearAll(true)
            if (typeof CookieManager.clearAll === 'function') {
              // some implementations accept (includeSharedCookies?: boolean)
              try {
                await CookieManager.clearAll();
              } catch {
                try {
                  // android / older API
                  await CookieManager.clearAll(true);
                } catch {
                  // ignore
                }
              }
            } else if (typeof CookieManager.clear === 'function') {
              // some older versions offer clear()
              try {
                await CookieManager.clear();
              } catch {
                // ignore
              }
            }
          } catch (e) {
            // don't fail hard if cookie clearing fails
            // eslint-disable-next-line no-console
            console.warn('CookieManager.clearAll failed', e);
          }
        }

        // 3) Clear WebView cache if supported
        try {
          // @ts-ignore - WebView may provide clearCache(flag)
          if (webviewRef.current && typeof (webviewRef.current as any).clearCache === 'function') {
            try {
              // try Android style
              (webviewRef.current as any).clearCache(true);
            } catch {
              try {
                // fallback
                (webviewRef.current as any).clearCache();
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore any cache clearing errors
        }

        // 4) reload the webview to ensure cleared state applied
        try {
          webviewRef.current?.reload?.();
        } catch {
          // ignore
        }
      } catch (e) {
        // overall best-effort - swallow so callers don't crash
        // eslint-disable-next-line no-console
        console.warn('SecureWebView.clearData failed', e);
      }
    };

    // expose handle to parent components
    useImperativeHandle(ref, () => ({
      reload: () => webviewRef.current?.reload?.(),
      goBack: () => webviewRef.current?.goBack?.(),
      goForward: () => webviewRef.current?.goForward?.(),
      injectJavaScript: (js: string) => webviewRef.current?.injectJavaScript?.(js),
      clearData,
    }), [webviewRef]);

    // Listen for global clear events
    useEffect(() => {
      const unsub = onEvent('clear-webview-data', async () => {
        try {
          await clearData();
        } catch {
          // ignore
        }
      });
      return () => {
        // unsub is a function returned from onEvent
        try { unsub(); } catch {}
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <WebView
        ref={webviewRef}
        source={{ uri }}
        injectedJavaScript={injectedJavaScript}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        style={style}
        javaScriptEnabled={jsEnabled}
        domStorageEnabled={!incognito}
        // disable third-party cookies on Android where supported
        thirdPartyCookiesEnabled={false}
      />
    );
  },
);

export default SecureWebView;