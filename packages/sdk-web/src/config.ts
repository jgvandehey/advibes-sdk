/**
 * AdVibes Config — Project-level configuration for ad integration.
 *
 * Developers (or their AI agents) create an `advibes.config.ts` file in their
 * project root to declare ad preferences. The SDK and agents read this config
 * to understand where and how to place ads.
 *
 * Example:
 * ```ts
 * // advibes.config.ts
 * import { defineAdVibesConfig } from '@advibes/sdk-web/config'
 *
 * export default defineAdVibesConfig({
 *   publisherId: 'pub_xxx',
 *   app: {
 *     name: 'My Cool App',
 *     category: 'productivity',
 *     platform: 'web',
 *   },
 *   ads: {
 *     formats: ['card', 'banner'],
 *     maxPerPage: 2,
 *     placements: [
 *       {
 *         id: 'pl_sidebar',
 *         format: 'card',
 *         location: 'sidebar',
 *         description: 'Right sidebar below navigation',
 *       },
 *       {
 *         id: 'pl_footer',
 *         format: 'banner',
 *         location: 'footer',
 *         description: 'Above the page footer',
 *       },
 *     ],
 *   },
 *   restrictions: {
 *     noAdsOnPages: ['/login', '/signup', '/checkout', '/settings'],
 *     blockedCategories: [],
 *     requireConsent: true,
 *   },
 *   style: {
 *     theme: 'dark',
 *     accentColor: '#8b5cf6',
 *     borderRadius: 12,
 *     showSponsoredLabel: true,
 *   },
 * })
 * ```
 */

import type { AdFormat } from "./index";

export interface AdVibesPlacement {
  /** Placement ID from the AdVibes dashboard */
  id: string;
  /** Ad format for this placement */
  format: AdFormat;
  /** Where in the app this placement lives (descriptive, for agents) */
  location: string;
  /** Human-readable description of where the ad appears */
  description?: string;
}

export interface AdVibesProjectConfig {
  /** Your AdVibes publisher ID / API key prefix */
  publisherId: string;

  /** Optional custom ad server URL */
  serverUrl?: string;

  /** App metadata */
  app?: {
    name?: string;
    category?: string;
    platform?: "web" | "ios" | "android";
  };

  /** Ad configuration */
  ads?: {
    /** Which formats the developer is OK with */
    formats?: AdFormat[];
    /** Max ads per page/screen */
    maxPerPage?: number;
    /** Declared placements */
    placements?: AdVibesPlacement[];
  };

  /** Restrictions */
  restrictions?: {
    /** Pages/routes where ads should NOT appear */
    noAdsOnPages?: string[];
    /** Ad categories to block */
    blockedCategories?: string[];
    /** Require user consent before showing ads (GDPR) */
    requireConsent?: boolean;
  };

  /** Visual styling */
  style?: {
    /** Color theme: 'dark' | 'light' | 'auto' */
    theme?: "dark" | "light" | "auto";
    /** Accent color for CTA buttons */
    accentColor?: string;
    /** Border radius in pixels */
    borderRadius?: number;
    /** Show "Sponsored" label on ads */
    showSponsoredLabel?: boolean;
  };
}

/**
 * Define your AdVibes project configuration.
 * This is a type helper — it returns the config object as-is.
 */
export function defineAdVibesConfig(
  config: AdVibesProjectConfig
): AdVibesProjectConfig {
  return config;
}
