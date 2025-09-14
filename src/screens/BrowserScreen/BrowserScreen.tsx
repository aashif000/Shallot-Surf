// src/screens/BrowserScreen/BrowserScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  NativeSyntheticEvent,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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

  // navigation availability
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // progress animation
  const progress = useRef(new Animated.Value(0)).current;

  // Tabs state (simple multi-tab)
  const [tabs, setTabs] = useState<TabModel[]>([{ id: 't-1', url: initialUrl, title: 'New Tab' }]);
  const [activeTabId, setActiveTabId] = useState<string>('t-1');

  // Load persisted tabs on mount (if not clearing on exit)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (clearOnExit) {
        if (mounted) {
          setTabs([{ id: 't-1', url: initialUrl, title: 'New Tab' }]);
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
          setTabs([{ id: 't-1', url: initialUrl, title: 'New Tab' }]);
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
  useEffect(() => {
    if (clearOnExit) return;
    const timer = setTimeout(async () => {
      try {
        const toPersist: PersistedTab[] = tabs.map(t => ({ id: t.id, url: t.url, title: t.title, createdAt: Date.now() }));
        await tabsStore.setAll(toPersist);
      } catch (e) {
        console.warn('Failed to persist tabs', e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [tabs, clearOnExit]);

  const currentTab = useMemo(() => tabs.find(t => t.id === activeTabId) ?? tabs[0], [tabs, activeTabId]);

  // Safely extract hostname for UI (defensive)
  const safeHostname = (u?: string) => {
    try {
      if (!u) return '';
      const hh = new URL(u).hostname;
      return hh;
    } catch {
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
        } else if (w && typeof w.loadUrl === 'function') {
          // some wrappers expose a loadUrl style method
          w.loadUrl(uri);
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
        return next.length ? next : [{ id: 't-1', url: initialUrl, title: 'New Tab' }];
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
    // Present share sheet as a friendly fallback
    Share.share({ message: u, url: u }).catch(() => {
      Alert.alert('Open externally', `Would open: ${u}`, [{ text: 'OK' }]);
    });
  }, [currentTab]);

  // Navigation state change hook (updates back/forward availability and title)
  const handleNavigationStateChange = useCallback((navState: any) => {
    // navState typically contains: url, title, canGoBack, canGoForward
    if (!navState) return;
    setCanGoBack(Boolean(navState.canGoBack));
    setCanGoForward(Boolean(navState.canGoForward));

    // update address to reflect real navigated URL (non-invasive)
    if (navState.url && navState.url !== address) {
      setAddress(navState.url);
    }

    // update tab title if available (non-destructive)
    if (navState.title) {
      setTabs(prev => prev.map(t => (t.id === activeTabId ? { ...t, title: navState.title } : t)));
    }
  }, [activeTabId, address]);

  // Loading / progress handlers
  const handleLoadStart = useCallback(() => {
    setLoading(true);
    // animate small initial progress
    Animated.timing(progress, {
      toValue: 0.12,
      duration: 250,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [progress]);

  const handleLoadEnd = useCallback(() => {
    // animate to full and fade
    Animated.timing(progress, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    }).start(() => {
      // reset after a small delay so progress bar hides nicely
      setTimeout(() => {
        progress.setValue(0);
        setLoading(false);
      }, 220);
    });
  }, [progress]);

  // If the underlying WebView supports onLoadProgress, it can call this with { nativeEvent: { progress } }
  // --- TYPED PROGRESS EVENT: avoids 'property progress does not exist' error ---
  const handleProgress = useCallback((evt: NativeSyntheticEvent<{ progress?: number }>) => {
    try {
      const p = evt.nativeEvent?.progress;
      if (typeof p === 'number') {
        Animated.timing(progress, {
          toValue: Math.max(0.08, Math.min(0.98, p)),
          duration: 120,
          useNativeDriver: false,
        }).start();
      }
    } catch {
      // ignore
    }
  }, [progress]);

  // Error handler
  const handleError = useCallback((e: NativeSyntheticEvent<any>) => {
    console.warn('WebView error', e.nativeEvent ?? e);
  }, []);

  // helper: show long press menu for a tab (keeps original close behaviour intact)
  const onTabLongPress = useCallback((item: TabModel) => {
    Alert.alert(item.title ?? safeHostname(item.url) ?? 'Tab', undefined, [
      { text: 'Reload tab', onPress: () => { if (item.id === activeTabId) webviewRef.current?.reload?.(); } },
      {
        text: 'Duplicate tab',
        onPress: () => {
          const id = `t-${Date.now()}`;
          setTabs(prev => {
            const idx = prev.findIndex(p => p.id === item.id);
            const next = [...prev];
            next.splice(idx + 1, 0, { id, url: item.url, title: item.title });
            return next;
          });
        },
      },
      { text: 'Close tab', onPress: () => closeTab(item.id), style: 'destructive' },
      { text: 'Share', onPress: () => { Share.share({ message: item.url, url: item.url }).catch(() => {}); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [activeTabId, closeTab]);

  // UI helpers
  const isSecure = (u?: string) => (u ? /^https:\/\//i.test(u) : false);

  // address clear action
  const clearAddress = useCallback(() => {
    setAddress('');
  }, []);

  // --- Extra props spread as `any` to avoid strict typing mismatch with SecureWebView wrapper ---
  const extraWebViewProps: any = {
    onNavigationStateChange: handleNavigationStateChange,
    onLoadProgress: handleProgress,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Orbot Status Panel 
      <View style={styles.topCardWrap}>
        <OrbotStatusPanel />
      </View> */}

      {/* Address Bar */}
      <View style={styles.topBar}>
        <View style={styles.navButtons}>
          <Pressable 
            onPress={() => webviewRef.current?.goBack?.()} 
            style={[styles.navButton, !canGoBack && styles.disabledButton]} 
            disabled={!canGoBack}
          >
            <Ionicons name="arrow-back" size={20} color={canGoBack ? '#2C3E50' : '#BDC3C7'} />
          </Pressable>
          
          <Pressable 
            onPress={() => webviewRef.current?.goForward?.()} 
            style={[styles.navButton, !canGoForward && styles.disabledButton]} 
            disabled={!canGoForward}
          >
            <Ionicons name="arrow-forward" size={20} color={canGoForward ? '#2C3E50' : '#BDC3C7'} />
          </Pressable>
          
          <Pressable onPress={() => webviewRef.current?.reload?.()} style={styles.navButton}>
            <Ionicons name="refresh" size={20} color="#2C3E50" />
          </Pressable>
        </View>

        <View style={styles.addressContainer}>
          <View style={styles.securityIndicator}>
            {isSecure(currentTab?.url) ? (
              <Ionicons name="lock-closed" size={14} color="#27AE60" />
            ) : (
              <Ionicons name="alert-circle-outline" size={14} color="#E74C3C" />
            )}
          </View>
          
          <TextInput
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={() => go(address)}
            placeholder="Search or enter website address"
            returnKeyType="go"
            autoCapitalize="none"
            keyboardType="url"
            clearButtonMode="while-editing"
            accessibilityLabel="Address input"
            accessibilityHint="Enter URL or search term and press go"
          />
          
          {loading ? (
            <ActivityIndicator size="small" color="#3498DB" style={styles.loadingIndicator} />
          ) : (
            <Pressable onPress={openExternal} style={styles.externalButton}>
              <Ionicons name="open-outline" size={18} color="#3498DB" />
            </Pressable>
          )}
        </View>
        
        <TouchableOpacity onPress={() => addTab()} style={styles.addTabButton}>
          <Ionicons name="add" size={24} color="#3498DB" />
        </TouchableOpacity>
      </View>

      {/* Tabs strip */}
      {tabs.length > 1 && (
        <View style={styles.tabStrip}>
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
                  style={[styles.tab, active ? styles.activeTab : undefined]}
                  onPress={() => switchTab(item.id)}
                  onLongPress={() => onTabLongPress(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.tabContent}>
                    <Text style={[styles.tabTitle, active ? styles.activeTabTitle : undefined]} numberOfLines={1}>
                      {item.title ?? safeHostname(item.url) ?? 'New Tab'}
                    </Text>
                    <Pressable 
                      onPress={() => closeTab(item.id)} 
                      style={styles.tabCloseButton}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={14} color={active ? '#2C3E50' : '#7F8C8D'} />
                    </Pressable>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* WebView container */}
      <View style={styles.webviewContainer}>
        {/* Progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              opacity: progress.interpolate({ inputRange: [0, 0.02, 0.98, 1], outputRange: [0, 1, 1, 0] }),
            },
          ]}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#3498DB" />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        )}

        <SecureWebView
          ref={webviewRef}
          uri={currentTab.url}
          style={styles.webview}
          injectedJavaScript={injectedJS}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          // spread any optional handlers as `any` to avoid tight type coupling with the wrapper
          {...extraWebViewProps}
        />
      </View>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <Pressable onPress={openExternal} style={styles.bottomButton}>
          <Ionicons name="share-outline" size={22} color="#2C3E50" />
          <Text style={styles.bottomButtonLabel}>Share</Text>
        </Pressable>
        
        <Pressable onPress={() => addTab()} style={styles.bottomButton}>
          <Ionicons name="add" size={24} color="#2C3E50" />
          <Text style={styles.bottomButtonLabel}>New Tab</Text>
        </Pressable>
        
        <Pressable onPress={() => {}} style={styles.bottomButton}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#2C3E50" />
          <Text style={styles.bottomButtonLabel}>More</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1'
  },
  
  navButtons: {
    flexDirection: 'row',
    marginRight: 8,
  },
  
  navButton: {
    padding: 6,
    marginRight: 4,
    borderRadius: 4,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  addressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 8,
  },
  
  securityIndicator: {
    marginRight: 6,
  },
  
  addressInput: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
    paddingVertical: 2,
  },
  
  loadingIndicator: {
    marginLeft: 6,
  },
  
  externalButton: {
    padding: 4,
  },
  
  addTabButton: {
    padding: 4,
    marginLeft: 4,
  },
  
  tabStrip: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    backgroundColor: '#FFFFFF',
  },
  
  tabList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    minWidth: 100,
    maxWidth: 200,
  },
  
  activeTab: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#3498DB',
  },
  
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  tabTitle: {
    fontSize: 13,
    color: '#7F8C8D',
    flex: 1,
    marginRight: 6,
  },
  
  activeTabTitle: {
    color: '#2C3E50',
    fontWeight: '600',
  },
  
  tabCloseButton: {
    padding: 2,
  },
  
  webviewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  webview: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  
  progressBar: {
    height: 2,
    backgroundColor: '#3498DB',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 40,
  },
  
  loadingOverlay: {
    position: 'absolute',
    zIndex: 30,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  
  loadingText: { 
    marginTop: 8, 
    color: '#3498DB', 
    fontSize: 14 
  },
  
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    backgroundColor: '#FFFFFF',
  },
  
  bottomButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  
  bottomButtonLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },

  topCardWrap: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: '#F9FAFB', // soft iOS-like gray background
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB', // subtle divider
},

});