// src/components/Browser/TabView.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface TabModel {
  id: string;
  url: string;
  title?: string;
}

interface TabViewProps {
  tabs: TabModel[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
}

export default function TabView({ tabs, activeIndex, onTabPress, onCloseTab, onAddTab }: TabViewProps) {
  return (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tabs.map((tab, i) => {
          const active = i === activeIndex;
          const label = tab.title || (tab.url ? hostnameFromUrl(tab.url) : 'New Tab');
          return (
            <View key={tab.id} style={[styles.tabWrap]}>
              <TouchableOpacity
                style={[styles.tab, active && styles.activeTab]}
                onPress={() => onTabPress(i)}
                activeOpacity={0.85}
              >
                {/* favicon / initial */}
                <View style={[styles.favicon, active ? styles.faviconActive : undefined]}>
                  <Text style={[styles.faviconText, active ? styles.faviconTextActive : undefined]}>
                    {(label && label.charAt(0).toUpperCase()) || 'S'}
                  </Text>
                </View>

                <Text style={[styles.tabTitle, active ? styles.tabTitleActive : undefined]} numberOfLines={1}>
                  {label}
                </Text>

                <TouchableOpacity onPress={() => onCloseTab(tab.id)} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {/* nicer close icon: outline / circle depending on platform */}
                  <Ionicons
                    name={Platform.OS === 'ios' ? 'close' : 'close'}
                    size={16}
                    color={active ? '#0747A6' : '#667085'}
                    // use outline/circle icons for visual clarity
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add new tab button */}
        <TouchableOpacity style={styles.newTabButton} onPress={onAddTab} activeOpacity={0.9}>
          <Ionicons name="add-circle" size={26} color="#0a84ff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function hostnameFromUrl(u?: string) {
  if (!u) return '';
  try {
    return new URL(u).hostname.replace('www.', '');
  } catch {
    // fallback
    return u.replace(/^https?:\/\//, '').split('/')[0];
  }
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#f6fbff',
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 12,
  },
  tabWrap: {
    marginRight: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e9f2ff',
    borderRadius: 12,
    minWidth: 110,
    maxWidth: 220,
  },
  activeTab: {
    backgroundColor: '#DBEEFF',
    borderWidth: 1,
    borderColor: '#0a84ff',
  },
  favicon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  faviconActive: {
    backgroundColor: '#e1f0ff',
  },
  faviconText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  faviconTextActive: {
    color: '#0747A6',
  },
  tabTitle: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
  },
  tabTitleActive: {
    color: '#0747A6',
    fontWeight: '600',
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  newTabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
});
