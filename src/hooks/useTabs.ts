// src/hooks/useTabs.ts
import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * useTabs - Manage browser tabs (UI-first)
 *
 * API:
 *  const { tabs, activeTab, activeIndex, addTab, closeTab, switchTab, updateTabUrl, setTabs }
 *
 * Notes:
 * - This is purely in-memory. If you want persistence, call your storage adapter.
 * - Uses uuid for tab ids. If you don't have 'uuid' installed, replace with Date.now() based IDs.
 */

export type TabModel = {
  id: string;
  url: string;
  title?: string;
};

export default function useTabs(initial: TabModel[] = [{ id: 't-1', url: 'https://duckduckgo.com', title: 'New Tab' }]) {
  // If uuid is unavailable (not installed), fallback to timestamp id
  const mkId = () => {
    try {
      return uuidv4();
    } catch {
      return `t-${Date.now()}`;
    }
  };

  const [tabs, setTabs] = useState<TabModel[]>(initial);

  const activeIndex = 0; // default index if you manage single-tab; consumer can manage activeId separately
  const activeTab = tabs[activeIndex];

  const addTab = useCallback((url?: string, title?: string) => {
    const id = mkId();
    const newTab: TabModel = { id, url: url ?? 'https://duckduckgo.com', title: title ?? 'New Tab' };
    setTabs(prev => [...prev, newTab]);
    return id;
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      // always keep at least one tab
      if (next.length === 0) {
        return [{ id: mkId(), url: 'https://duckduckgo.com', title: 'New Tab' }];
      }
      return next;
    });
  }, []);

  const switchTab = useCallback((id: string) => {
    // Consumers typically store activeTabId; this hook returns the tabs array and helpers.
    // We intentionally keep this function simple; it returns whether the id exists.
    const exists = tabs.some(t => t.id === id);
    return exists;
  }, [tabs]);

  const updateTabUrl = useCallback((id: string, url: string) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, url } : t)));
  }, []);

  const updateTabTitle = useCallback((id: string, title: string) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, title } : t)));
  }, []);

  const resetTabs = useCallback((fallbackUrl = 'https://duckduckgo.com') => {
    setTabs([{ id: mkId(), url: fallbackUrl, title: 'New Tab' }]);
  }, []);

  return useMemo(() => ({
    tabs,
    setTabs,
    activeTab,
    activeIndex,
    addTab,
    closeTab,
    switchTab,
    updateTabUrl,
    updateTabTitle,
    resetTabs,
  }), [tabs, activeTab, activeIndex, addTab, closeTab, switchTab, updateTabUrl, updateTabTitle, resetTabs]);
}
