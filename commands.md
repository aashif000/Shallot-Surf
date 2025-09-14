npx create-expo-app shallotsurf
y
cd shallotsurf

# inside shallotsurf/
npm install react-native-webview
npm install @react-native-cookies/cookies
# TypeScript types (dev)
npm install -D @types/react @types/react-native


// File: README_PHASE_D.md
# Phase D — Advanced & Native integration (notes)

This set of files contains UI-first implementations and placeholders for native integration points required to complete Phase D:

10) Orbot launcher & status panel
- `OrbotLauncher.tsx` opens Orbot deep-link or Play Store. Determining whether Orbot is running requires a native listener (Orbot broadcasts or content-provider).

11) Bridges UI + torController.ts
- `BridgesScreen.tsx` provides full UI for entering bridge lines and saving/enabling them.
- `torController.ts` is a stub that throws until a native module is implemented. We expect the native module to expose methods: `getStatus`, `start`, `stop`, `setBridges`, `enableBridges`.

12) DOH / certificate pinning settings (UI first)
- `NetworkSecuritySettings.tsx` implements toggles, DOH URL change, and a list-based pin manager stored in AsyncStorage.
- Native networking stack (OkHttp / iOS URLSession) must read AsyncStorage (or a secure native-backed store) and enforce DOH and pinning. Consider exposing a native API to pull configuration or having the native side read a persisted config file.

# Next steps (prioritized)
1. Implement native `torController` as a React Native native module:
   - Android: integrate with Orbot via Intents or embed Tor using Tor-Android library / OnionKit. Provide IPC to read status and apply bridges.
   - iOS: embed Tor using Tor.framework and expose similar bridge application APIs.
2. Implement native bridge to read network security settings and apply them at the transport layer:
   - Android: OkHttp DNS-over-HTTPS interceptor + CertificatePinner.
   - iOS: NSURLSession with custom `URLProtocol`/`NWConnection` and pinning.
3. Add telemetry and safety checks: verify DOH endpoints, validate pins (length/format), and provide safe rollback.

# Integration tips
- Keep security-sensitive data out of plain AsyncStorage for production — use secure storage or native file with limited access.
- Provide a "test" button in Settings that performs an HTTPS request to a pinned host to validate configuration.
- When implementing native modules, keep JS shim signatures stable to avoid breaking UI while native iterates.

