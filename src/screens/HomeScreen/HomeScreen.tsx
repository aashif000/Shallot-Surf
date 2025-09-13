// src/screens/HomeScreen/HomeScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityRole,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ActionButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  style?: any;
  testID?: string;
  accessibilityRole?: AccessibilityRole;
};

/**
 * Minimal, memoized action button used across the app.
 * - accepts `style` so parent can control spacing without changing the component
 * - exposes `testID` for SDET / automation
 * - provides a clear, consistent touch target and subtle press feedback
 */
const ActionButton = React.memo(function ActionButton({
  icon,
  label,
  onPress,
  style,
  testID,
  accessibilityRole = 'button',
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      hitSlop={8}
      android_ripple={{ color: 'rgba(10,132,255,0.12)' }}
      testID={testID ?? `action-${label.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <Ionicons name={icon} size={22} color="#0a84ff" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
});

type RecentItem = { id: string; title: string; url: string };

export default function HomeScreen() {
  const nav = useNavigation<any>();

  // subtle header entrance animation — purely visual, non-blocking
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const headerTranslate = useMemo(
    () => ({
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.994, 1],
          }),
        },
      ],
      opacity: anim,
    }),
    [anim],
  );

  // simple search input state (quick-launch into Browser)
  const [search, setSearch] = useState('');
  const onSearchSubmit = useCallback(() => {
    const q = (search || '').trim();
    // if blank, go to browser homepage
    const payload = q ? { url: q } : undefined;
    nav.navigate('Browser' as never, payload as never);
    setSearch('');
  }, [nav, search]);

  // placeholder "recent" items — you will later load persisted history
  const [recent] = useState<RecentItem[]>([
    { id: 'r1', title: 'DuckDuckGo', url: 'https://duckduckgo.com' },
    { id: 'r2', title: 'Privacy Guide', url: 'https://www.privacyguides.org' },
    { id: 'r3', title: 'Tor Project', url: 'https://www.torproject.org' },
  ]);

  const renderRecent = ({ item }: { item: RecentItem }) => (
    <TouchableOpacity
      style={styles.recentCard}
      onPress={() => nav.navigate('Browser' as never, { url: item.url } as never)}
      testID={`recent-${item.id}`}
      accessibilityLabel={`Open ${item.title}`}
    >
      <View style={styles.recentLeft}>
        <View style={styles.recentFavicon}>
          <Text style={styles.recentFaviconText}>{item.title.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.recentBody}>
        <Text style={styles.recentTitle}>{item.title}</Text>
        <Text style={styles.recentUrl} numberOfLines={1}>{item.url}</Text>
      </View>

      <View style={styles.recentRight}>
        <Ionicons name="open-outline" size={18} color="#0a84ff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'} backgroundColor="#f6fbff" />

      <View style={styles.page}>
        <Animated.View style={[styles.header, headerTranslate]}>
          <Text style={styles.title}>ShallotSurf</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Private • Fast • Simple • Secure</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => nav.navigate('Settings' as never)}
              accessibilityLabel="Open Settings"
              testID="open-settings"
            >
              <Ionicons name="settings-outline" size={20} color="#334155" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.card} accessibilityRole="summary" accessibilityLabel="Quick start card">
          <Text style={styles.cardTitle}>Quick Start</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                placeholder="Search or enter URL"
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={onSearchSubmit}
                returnKeyType="go"
                autoCapitalize="none"
                style={styles.searchInput}
                testID="home-search"
                accessibilityLabel="Search or enter URL"
              />
            </View>

            <ActionButton
              icon="globe"
              label="Open"
              onPress={() => nav.navigate('Browser' as never)}
              style={{ marginLeft: 10 }}
              testID="open-browser"
            />
          </View>

          <View style={styles.row}>
            <ActionButton icon="hourglass-outline" label="New Identity" onPress={() => {/* placeholder */}} />
            <ActionButton icon="eye-off" label="Incognito" onPress={() => {/* placeholder */}} style={{ marginLeft: 10 }} />
          </View>

          <Text style={styles.helperText}>Tip: build UI & flows first—connect Tor & native modules later.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity onPress={() => {/* future: clear history */}} testID="clear-recent">
            <Text style={styles.sectionAction}>Clear</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recent}
          keyExtractor={(i) => i.id}
          renderItem={renderRecent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Dev-friendly</Text>
          <Text style={styles.footerText} numberOfLines={3}>
            Reusable primitives, testIDs and consistent spacing let you scale screens fast with minimal refactor
            cost. Use the ActionButton component across screens for consistent touch targets and automated tests.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6fbff' },
  page: { flex: 1, padding: 16 },

  header: { marginTop: 4, marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', color: '#081226' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  subtitle: { color: '#556', fontSize: 13 },
  iconButton: { padding: 8, borderRadius: 10 },

  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  cardTitle: { fontWeight: '700', marginBottom: 12, fontSize: 16 },

  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchInput: { marginLeft: 8, fontSize: 15, color: '#081226', flex: 1 },

  row: { flexDirection: 'row', marginTop: 12 },
  action: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(10,132,255,0.06)',
  },
  actionSpacing: { marginRight: 10 },
  actionPressed: { transform: [{ scale: 0.995 }], opacity: 0.96 },
  actionText: { marginTop: 8, color: '#0a84ff', fontWeight: '600' },

  helperText: { color: '#667', marginTop: 12, fontSize: 13 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8 },
  sectionTitle: { fontWeight: '700', fontSize: 16 },
  sectionAction: { color: '#0a84ff' },

  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 1 },
    }),
  },
  recentLeft: { marginRight: 12 },
  recentFavicon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  recentFaviconText: { color: '#075985', fontWeight: '700' },
  recentBody: { flex: 1 },
  recentTitle: { fontWeight: '700', color: '#081226' },
  recentUrl: { color: '#64748b', marginTop: 2, fontSize: 12 },
  recentRight: { marginLeft: 12 },

  footerCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 1 },
    }),
  },
  footerTitle: { fontWeight: '700', marginBottom: 6 },
  footerText: { color: '#556' },
});
