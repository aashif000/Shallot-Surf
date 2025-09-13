
// File: src/modules/torController.ts
// Placeholder interface for native TorController. This module should be replaced
// with a native implementation (React Native native module or TurboModule) that
// talks to the platform's Tor stack (Orbot/OnionKit/custom native library).

export type TorStatus = 'stopped' | 'starting' | 'running' | 'error' | 'unknown';

const NOT_IMPLEMENTED = (): never => {
  throw new Error('torController native module not implemented. Implement native bridge to interact with Tor/Orbot.');
};
export const torController = {
  async getStatus(): Promise<TorStatus> {
    return NOT_IMPLEMENTED();
  },
  async start(): Promise<void> {
    return NOT_IMPLEMENTED();
  },
  async stop(): Promise<void> {
    return NOT_IMPLEMENTED();
  },
  async setBridges(bridges: string[]): Promise<void> {
    return NOT_IMPLEMENTED();
  },
  async enableBridges(enable = true): Promise<void> {
    return NOT_IMPLEMENTED();
  },
};


export default torController;

