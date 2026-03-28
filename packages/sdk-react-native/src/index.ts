/**
 * AdVibes React Native SDK (stub)
 *
 * Mobile ad SDK for React Native apps. Coming soon.
 */

export const SDK_VERSION = "0.1.0";

export type MobileAdFormat = "native_card" | "interstitial" | "native_banner";

export interface AdVibesRNConfig {
  publisherId: string;
  endpoint?: string;
}

export function init(_config: AdVibesRNConfig): void {
  console.log("[AdVibes RN] SDK stub — mobile ads coming soon.");
}
