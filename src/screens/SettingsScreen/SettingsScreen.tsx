// src/screens/SettingsScreen/SettingsScreen.tsx
import Confetti from '@/components/ui/Confetti';
import { useSettings } from '@/context/SettingsContext';
import { emit } from '@/services/events';
import { featureFlagsStore } from '@/services/featureFlags';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
 
/**
 * SettingsScreen — refactored UI
 * - Keeps all previous logic (useSettings, reset, update, DOH pick, New Identity)
 * - Upgraded visuals via local design tokens and press-scale micro-interactions
 *
 * Behavioural notes:
 * - The SettingsContext remains the single source of truth.
 * - After New Identity reset we call emit('clear-webview-data') (SecureWebView listens).
 */

/* ----------------------
   Design tokens (local)
   ---------------------- */
const Colors = {
  primary: '#0A84FF',
  accent: '#7C3AED',
  background: '#F6FBFF',
  surface: '#FFFFFF',
  muted: '#556',
  muted2: '#667',
  danger: '#EF4444',
  border: 'rgba(10,132,255,0.06)',
  softBg: '#F1F7FF',
};

const Radii = {
  small: 8,
  medium: 12,
  large: 16,
};

const Shadows = {
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 2 },
  }),
  toolbar: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 4 },
  }),
};

const Typography = {
  title: { fontSize: 22, fontWeight: '800' as const },
  h2: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
};

/* ---------- Types for clarity ---------- */
type FingerprintProtections = {
  canvas: boolean;
  webgl: boolean;
  audio: boolean;
};

type SettingsShape = {
  useTor: boolean;
  incognitoMode: boolean;
  defaultSearchEngine: 'duckduckgo' | 'google' | 'startpage';
  httpsOnly: boolean;
  disableJS: boolean;
  firstPartyIsolation: boolean;
  dohProvider?: string | null;
  safeBrowsing: 'off' | 'standard' | 'enhanced';
  clearOnExit: boolean;
  fingerprintProtections: FingerprintProtections;
  telemetryEnabled: boolean;
};

/* --------------------------
   Small polished primitives
   -------------------------- */

/** SwitchRow — accessible row with label, subtitle and switch */
function SwitchRow({
  label,
  sub,
  value,
  onValueChange,
  testID,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID?: string;
}) {
  return (
    <View style={localStyles.row} testID={testID} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <View style={{ flex: 1 }}>
        <Text style={localStyles.rowLabel}>{label}</Text>
        {sub ? <Text style={localStyles.rowSub}>{sub}</Text> : null}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e6ecf8', true: Colors.primary }}
        thumbColor={value ? Colors.primary : undefined}
        testID={testID ? `${testID}-switch` : undefined}
      />
    </View>
  );
}

/** OptionRow — pressable row with trailing chevron or custom node */
function OptionRow({
  label,
  sub,
  onPress,
  testID,
  trailing,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
  testID?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [localStyles.optionRow, pressed && localStyles.optionRowPressed]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={{ flex: 1 }}>
        <Text style={localStyles.rowLabel}>{label}</Text>
        {sub ? <Text style={localStyles.rowSub}>{sub}</Text> : null}
      </View>

      {trailing ?? <Ionicons name="chevron-forward" size={20} color={Colors.muted2} />}
    </Pressable>
  );
}

/* --------------------------
   Settings screen component
   -------------------------- */

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  const { settings, loading, update, reset } = useSettings(); // single source of truth
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // feature flag sample (persisted via featureFlagsStore)
  const [flagNewTabUi, setFlagNewTabUi] = useState<boolean>(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const enabled = await featureFlagsStore.isEnabled('newTabUi');
        if (!mounted) return;
        setFlagNewTabUi(Boolean(enabled));
      } catch {
        if (mounted) setFlagNewTabUi(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Open Orbot helper (uses native helper if available)
  const openOrbot = async () => {
    try {
      await openOrbotOrStore();
    } catch {
      Alert.alert('Error', 'Could not open Orbot or the store.');
    }
  };

  // New Identity flow
  const resetIdentity = () => {
    Alert.alert('New Identity', 'This will reset settings and clear web data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await reset(); // SettingsContext.reset()
            emit('clear-webview-data'); // SecureWebView listens for this
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1400);
            Alert.alert('Identity reset', 'Settings reset. Web data will be cleared.');
          } catch (e) {
            console.warn('Reset identity error', e);
            Alert.alert('Error', 'Could not reset identity.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  // DOH selection (uses Alert for choices; custom modal flow can be added)
  const handleDOHPick = () => {
    Alert.alert(
      'Choose DNS-over-HTTPS',
      undefined,
      [
        {
          text: 'Cloudflare (https://cloudflare-dns.com/dns-query)',
          onPress: () => update({ dohProvider: 'https://cloudflare-dns.com/dns-query' }),
        },
        {
          text: 'Google (https://dns.google/dns-query)',
          onPress: () => update({ dohProvider: 'https://dns.google/dns-query' }),
        },
        {
          text: 'Quad9 (https://dns.quad9.net/dns-query)',
          onPress: () => update({ dohProvider: 'https://dns.quad9.net/dns-query' }),
        },
        {
          text: 'Custom (enter URL)',
          onPress: () => {
            // Alert.prompt is only on iOS; replace later with ModalSheet for cross-platform
            Alert.prompt?.(
              'Custom DOH URL',
              'Enter full DOH endpoint (example: https://mydoh.example/dns-query)',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save',
                  onPress: async (text: string | undefined) => {
                    if (text) {
                      await update({ dohProvider: text });
                    }
                  },
                },
              ],
              'plain-text',
            );
          },
        },
        {
          text: 'Clear (use system)',
          onPress: () => update({ dohProvider: null }),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  // Toggle Tor with Orbot check
  const onToggleTor = async (value: boolean) => {
    if (value) {
      const installed = await isOrbotInstalled();
      if (!installed) {
        Alert.alert('Orbot not found', 'Install Orbot to enable Tor. Open Play Store?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Store', onPress: openOrbotOrStore },
        ]);
        return;
      }
    }
    await update({ useTor: value });
  };

  // Reset settings (advanced)
  const handleResetSettings = () => {
    Alert.alert('Reset settings', 'Reset all settings to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await reset();
            Alert.alert('Reset', 'Settings have been reset to defaults.');
          } catch (e) {
            console.warn('Reset settings error', e);
            Alert.alert('Error', 'Failed to reset settings.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[localStyles.page, localStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.muted }}>Loading settings…</Text>
      </View>
    );
  }

  const s = settings as SettingsShape;

  return (
    <View style={localStyles.page}>
      <Confetti visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} testID="settings-screen">
        {/* Header */}
        <View style={localStyles.headerRow}>
          <Text style={localStyles.header}>Privacy & Security</Text>
          <Pressable
            style={({ pressed }) => [localStyles.smallIconBtn, pressed && { opacity: 0.9 }]}
            onPress={() => nav.navigate?.('Home' as never)}
            testID="btn-settings-home"
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="home" size={18} color={Colors.accent} />
          </Pressable>
        </View>

        {/* Privacy Card */}
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Privacy</Text>

          <SwitchRow
            label="HTTPS-only mode"
            sub="Attempt to use HTTPS for all connections"
            value={s.httpsOnly}
            onValueChange={v => update({ httpsOnly: v })}
            testID="settings-https-only-switch"
          />

          <SwitchRow
            label="Clear cookies & site data on exit"
            sub="Helps keep sessions isolated between launches"
            value={s.clearOnExit}
            onValueChange={v => update({ clearOnExit: v })}
            testID="settings-clear-on-exit"
          />

          <OptionRow label="Default search engine" sub={s.defaultSearchEngine} onPress={() =>
            Alert.alert('Select Search Engine', undefined, [
              { text: 'DuckDuckGo', onPress: () => update({ defaultSearchEngine: 'duckduckgo' }) },
              { text: 'Startpage', onPress: () => update({ defaultSearchEngine: 'startpage' }) },
              { text: 'Google', onPress: () => update({ defaultSearchEngine: 'google' }) },
              { text: 'Cancel', style: 'cancel' },
            ])
          } testID="settings-search-engine" />

          <Pressable
            onPress={resetIdentity}
            style={({ pressed }) => [localStyles.primaryAction, pressed && localStyles.primaryActionPressed]}
            testID="settings-new-identity"
            accessibilityLabel="New Identity"
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={localStyles.primaryActionText}>{saving ? 'Working…' : 'New Identity'}</Text>
          </Pressable>
        </View>

        {/* Security Card */}
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Security</Text>

          <SwitchRow
            label="First-party isolation"
            sub="Limit cross-site tracking and storages"
            value={s.firstPartyIsolation}
            onValueChange={v => update({ firstPartyIsolation: v })}
            testID="settings-first-party-isolation"
          />

          <SwitchRow
            label="Disable JavaScript (global)"
            sub="Breaks many sites — use with caution"
            value={s.disableJS}
            onValueChange={v => Alert.alert(
              'Disable JavaScript',
              'Disabling JavaScript may break many websites. Proceed?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Disable', style: 'destructive', onPress: () => update({ disableJS: v }) },
              ],
              { cancelable: true },
            )}
            testID="settings-disable-js"
          />

          <OptionRow
            label="Fingerprint protections"
            sub="Canvas, WebGL & AudioContext"
            onPress={() => nav.navigate?.('PrivacyAdvanced' as never, { from: 'Settings' })}
            testID="settings-fingerprint-protections"
          />
        </View>

        {/* Tor & Connectivity Card */}
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Tor & Connectivity</Text>

          <SwitchRow
            label="Use Tor (Orbot)"
            sub="Route traffic via Tor (requires Orbot / native integration)"
            value={s.useTor}
            onValueChange={onToggleTor}
            testID="settings-use-tor"
          />

          <OptionRow label="Configure Bridges" sub="Obfs4 / Snowflake (advanced)" onPress={() => nav.navigate?.('Bridges' as never)} testID="settings-bridges" />

          <Pressable onPress={openOrbot} style={({ pressed }) => [localStyles.secondaryBtn, pressed && { opacity: 0.95 }]} testID="settings-open-orbot" accessibilityLabel="Install or open orbot">
            <Ionicons name="shield" size={16} color={Colors.primary} />
            <Text style={localStyles.secondaryBtnText}>Install / Open Orbot</Text>
          </Pressable>
        </View>

        {/* Performance Card */}
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Performance & UX</Text>

          <OptionRow
            label="Incognito Mode (quick toggle)"
            sub={s.incognitoMode ? 'Enabled' : 'Disabled'}
            onPress={() => update({ incognitoMode: !s.incognitoMode })}
            testID="settings-incognito"
            trailing={<Ionicons name={s.incognitoMode ? 'moon' : 'moon-outline'} size={18} color={Colors.muted2} />}
          />

          <OptionRow label="Downloads" sub="Manage downloaded files & storage" onPress={() => nav.navigate?.('Downloads' as never)} testID="settings-downloads" />
        </View>

        {/* Advanced Card */}
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Advanced</Text>

          <SwitchRow
            label="Enable telemetry (dev only)"
            sub="Helps troubleshooting — disabled by default"
            value={s.telemetryEnabled}
            onValueChange={v => update({ telemetryEnabled: v })}
            testID="settings-telemetry"
          />

          <SwitchRow
            label="Enable new tab UI (feature flag)"
            sub="Developer preview — toggle to test new tabs experience"
            value={flagNewTabUi}
            onValueChange={async v => {
              setFlagNewTabUi(v);
              await featureFlagsStore.set('newTabUi', v);
              emit('feature-flag-changed', { flag: 'newTabUi', value: v });
            }}
            testID="feature-new-tab-ui"
          />

          <Pressable
            onPress={handleResetSettings}
            style={({ pressed }) => [{ marginTop: 12 }, pressed && { opacity: 0.95 }]}
            testID="settings-reset"
          >
            <View style={[localStyles.primaryAction, { backgroundColor: Colors.danger }]}>
              <Ionicons name="refresh-circle" size={18} color="#fff" />
              <Text style={localStyles.primaryActionText}>Reset Settings</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

/* ----------------------
   Local styles (improved)
   ---------------------- */
const localStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  header: { ...Typography.title, color: '#081226' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.large,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardTitle: { ...Typography.h2, marginBottom: 10, color: '#081226' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { ...Typography.body, color: '#081226' },
  rowSub: { ...Typography.caption, color: Colors.muted2, marginTop: 4 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: Radii.medium,
  },
  optionRowPressed: { backgroundColor: Colors.softBg },

  primaryAction: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.medium,
    minHeight: 44,
  },
  primaryActionPressed: { transform: [{ scale: 0.995 }], opacity: 0.98 },
  primaryActionText: { color: '#fff', fontWeight: '700', marginLeft: 8 },

  secondaryBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radii.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: { color: Colors.primary, marginLeft: 8, fontWeight: '700' },

  smallIconBtn: {
    padding: 8,
    borderRadius: Radii.small,
    backgroundColor: '#F6F0FF',
  },
});
