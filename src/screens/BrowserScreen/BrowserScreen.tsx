// src/screens/BrowserScreen/BrowserScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SecureWebView, { SecureWebViewHandle } from '@/components/Browser/SecureWebView';
import { useSettings } from '@/context/SettingsContext';
import { PersistedTab, tabsStore } from '@/services/storage/tabsStore';

type TabModel = { id: string; url: string; title?: string };

export default function BrowserScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const initialUrl = route?.params?.url ?? 'https://duckduckgo.com';

  const { settings } = useSettings();
  const clearOnExit = settings?.clearOnExit ?? true;

  const [address, setAddress] = useState<string>(initialUrl);
  const webviewRef = useRef<SecureWebViewHandle | null>(null);
  const [loading, setLoading] = useState(false);

  // Tabs state (simple multi-tab)
  const [tabs, setTabs] = useState<TabModel[]>([{ id: 't-1', url: initialUrl, title: 'DuckDuckGo' }]);
  const [activeTabId, setActiveTabId] = useState<string>('t-1');

  // Load persisted tabs on mount (if not clearing on exit)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (clearOnExit) {
        if (mounted) {
          setTabs([{ id: 't-1', url: initialUrl, title: 'DuckDuckGo' }]);
          setActiveTabId('t-1');
          setAddress(initialUrl);
        }
        return;
      }
      try {
        const persisted = await tabsStore.getAll();
        if (!mounted) return;
        if (Array.isArray(persisted) && persisted.length > 0) {
          const mapped = persisted.map(p => ({ id: p.id, url: p.url, title: p.title }));
          setTabs(mapped);
          setActiveTabId(mapped[0].id);
          setAddress(mapped[0].url);
        } else {
          setTabs([{ id: 't-1', url: initialUrl, title: 'DuckDuckGo' }]);
        }
      } catch (e) {
        console.warn('Failed to load tabs', e);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist tabs (debounced) when not clearing on exit
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (clearOnExit) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    saveTimer.current = (setTimeout(async () => {
      try {
        const toPersist: PersistedTab[] = tabs.map(t => ({ id: t.id, url: t.url, title: t.title, createdAt: Date.now() }));
        await tabsStore.setAll(toPersist);
      } catch (e) {
        console.warn('Failed to persist tabs', e);
      }
    }, 600) as any) as unknown as number;

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [tabs, clearOnExit]);

  const currentTab = useMemo(() => tabs.find(t => t.id === activeTabId) ?? tabs[0], [tabs, activeTabId]);

  // Safely extract hostname for UI (defensive)
  const safeHostname = (u?: string) => {
    try {
      if (!u) return '';
      const hh = new URL(u).hostname;
      return hh;
    } catch {
      // fallback basic extraction
      const m = u?.replace(/^https?:\/\//i, '').split('/')[0];
      return m ?? '';
    }
  };

  // Convert user input into a usable URI or search query (DuckDuckGo fallback)
  const toUri = useCallback(
    (raw: string) => {
      const trimmed = (raw ?? '').trim();
      if (!trimmed) return initialUrl;
      if (/^https?:\/\//i.test(trimmed)) return trimmed; // already a full URL
      if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(trimmed)) return `https://${trimmed}`;
      return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
    },
    [initialUrl],
  );

  // Navigate current tab to the provided input
  const go = useCallback(
    (raw: string) => {
      const uri = toUri(raw);
      setAddress(uri);
      setTabs(prev => prev.map(t => (t.id === activeTabId ? { ...t, url: uri } : t)));

      // Best-effort instruct the webview to navigate immediately
      const w = webviewRef.current as any | null;
      try {
        if (w && typeof w.injectJavaScript === 'function') {
          const js = `window.location.href = ${JSON.stringify(uri)}; true;`;
          w.injectJavaScript(js);
        }
      } catch {
        // ignore if wrapper doesn't support it
      }

      Keyboard.dismiss();
    },
    [activeTabId, toUri],
  );

  const addTab = useCallback(
    (url?: string) => {
      const id = `t-${Date.now()}`;
      const newTab = { id, url: url ?? initialUrl, title: 'New Tab' } as TabModel;
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(id);
      setAddress(newTab.url);
    },
    [initialUrl],
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs(prev => {
        const next = prev.filter(t => t.id !== id);
        if (id === activeTabId) {
          const fallback = next.length ? next[Math.max(0, next.length - 1)] : { id: 't-1', url: initialUrl };
          setActiveTabId(fallback.id);
          setAddress(fallback.url);
        }
        return next.length ? next : [{ id: 't-1', url: initialUrl, title: 'DuckDuckGo' }];
      });
    },
    [activeTabId, initialUrl],
  );

  const switchTab = useCallback(
    (id: string) => {
      const tab = tabs.find(t => t.id === id);
      if (!tab) return;
      setActiveTabId(id);
      setAddress(tab.url);
    },
    [tabs],
  );

  const injectedJS = `try { delete navigator.__proto__.webdriver; } catch(e) {} true;`;

  // Derived UI values
  const tabIndex = Math.max(0, tabs.findIndex(t => t.id === activeTabId));
  const pageTitle = currentTab?.title ?? (currentTab?.url ? safeHostname(currentTab.url) : 'New Tab');

  // Quick action: open external (share) or copy URL
  const openExternal = useCallback(() => {
    const u = currentTab?.url;
    if (!u) return Alert.alert('No URL', 'There is no active URL to open externally.');
    // For now use Linking - but keep placeholder
    // Linking.openURL(u).catch(() => Alert.alert('Failed', 'Unable to open external browser.'));
    Alert.alert('Open externally', `Would open: ${u}`, [{ text: 'OK' }]);
  }, [currentTab]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Address Card */}
      <View style={styles.topCardWrap}>
        <View style={styles.addressCard}>
          <View style={styles.favicon}>
            <Text style={styles.faviconText}>{(safeHostname(currentTab?.url) || 'S').charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.addressInputWrap}>
            <Text style={styles.addressLabel}>Address</Text>
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              onSubmitEditing={() => go(address)}
              placeholder="Search or enter URL"
              returnKeyType="go"
              autoCapitalize="none"
              keyboardType="url"
              clearButtonMode="while-editing"
              accessibilityLabel="Address input"
            />
          </View>

          <View style={styles.addressActions}>
            <Pressable onPress={() => webviewRef.current?.reload?.()} style={styles.iconAction}>
              <Ionicons name="reload" size={20} color="#0a84ff" />
            </Pressable>
            <Pressable onPress={() => webviewRef.current?.goBack?.()} style={styles.iconAction}>
              <Ionicons name="arrow-back" size={20} color="#334155" />
            </Pressable>
            <Pressable onPress={() => webviewRef.current?.goForward?.()} style={styles.iconAction}>
              <Ionicons name="arrow-forward" size={20} color="#334155" />
            </Pressable>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLeft}>Tab {tabIndex + 1} of {tabs.length}</Text>
          <Text style={styles.metaRight}>{safeHostname(currentTab?.url)}</Text>
        </View>
      </View>

      {/* Tabs strip (horizontal scrollable) */}
      <View style={styles.tabStripWrap}>
        <FlatList
          data={tabs}
          horizontal
          keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
          renderItem={({ item }) => {
            const active = item.id === activeTabId;
            return (
              <TouchableOpacity
                style={[styles.tabPill, active ? styles.tabPillActive : undefined]}
                onPress={() => switchTab(item.id)}
                onLongPress={() => closeTab(item.id)}
                accessibilityRole="button"
              >
                <Text style={[styles.tabPillText, active ? styles.tabPillTextActive : undefined]} numberOfLines={1}>
                  {item.title ?? safeHostname(item.url) ?? 'New Tab'}
                </Text>
                <Pressable onPress={() => closeTab(item.id)} style={styles.tabCloseBtn}>
                  <Ionicons name="close" size={14} color={active ? '#0747A6' : '#667085'} />
                </Pressable>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity style={styles.tabAddBtn} onPress={() => addTab()}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          }
        />
      </View>

      {/* WebView container */}
      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#0a84ff" />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        )}

        <SecureWebView
          ref={webviewRef}
          uri={currentTab.url}
          style={styles.webview}
          injectedJavaScript={injectedJS}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(e: any) => console.warn('WebView error', e)}
        />
      </View>

      {/* Bottom toolbar */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => webviewRef.current?.goBack?.()} style={styles.bottomBtn}>
          <Ionicons name="arrow-back" size={20} color="#334155" />
          <Text style={styles.bottomBtnLabel}>Back</Text>
        </Pressable>

        <Pressable onPress={() => webviewRef.current?.goForward?.()} style={styles.bottomBtn}>
          <Ionicons name="arrow-forward" size={20} color="#334155" />
          <Text style={styles.bottomBtnLabel}>Forward</Text>
        </Pressable>

        <Pressable onPress={openExternal} style={[styles.bottomBtn, styles.primaryAction]}>
          <Ionicons name="open" size={18} color="#fff" />
          <Text style={[styles.bottomBtnLabel, styles.primaryActionLabel]}>Open</Text>
        </Pressable>

        <Pressable onPress={() => addTab()} style={[styles.bottomBtn, styles.primaryAction, { marginLeft: 8 }]}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={[styles.bottomBtnLabel, styles.primaryActionLabel]}>New</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbff' },

  topCardWrap: { paddingHorizontal: 12, paddingBottom: 6 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  favicon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  faviconText: { color: '#334155', fontWeight: '700' },

  addressInputWrap: { flex: 1 },
  addressLabel: { fontSize: 11, color: '#6b7280' },
  addressInput: { fontSize: 16, paddingVertical: 6, color: '#081226' },

  addressActions: { marginLeft: 8, flexDirection: 'row', alignItems: 'center' },
  iconAction: { padding: 6, marginLeft: 4 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  metaLeft: { fontSize: 12, color: '#94a3b8' },
  metaRight: { fontSize: 12, color: '#94a3b8' },

  tabStripWrap: { paddingTop: 6, paddingBottom: 6 },
  tabList: { paddingHorizontal: 12, alignItems: 'center' },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    minWidth: 110,
  },
  tabPillActive: {
    backgroundColor: '#DBEEFF',
    borderColor: '#0a84ff',
    borderWidth: 1,
  },
  tabPillText: { fontSize: 13, color: '#334155', flexShrink: 1 },
  tabPillTextActive: { color: '#0747A6', fontWeight: '700' },
  tabCloseBtn: { marginLeft: 8, padding: 6 },

  tabAddBtn: {
    backgroundColor: '#0a84ff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webviewContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 1 },
    }),
  },
  webview: { flex: 1, backgroundColor: '#fff' },

  loadingOverlay: {
    position: 'absolute',
    zIndex: 30,
    left: 16,
    right: 16,
    top: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    alignItems: 'center',
  },
  loadingText: { marginTop: 8, color: '#0a84ff', fontWeight: '600' },

  bottomBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eef2ff',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row' },
  bottomBtnLabel: { marginLeft: 6, fontSize: 13, color: '#334155' },

  primaryAction: { backgroundColor: '#0a84ff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  primaryActionLabel: { color: '#fff', fontWeight: '700' },
});
