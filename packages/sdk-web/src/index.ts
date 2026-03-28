/**
 * AdVibes Web SDK
 *
 * Monetize your web app with ads from the AdVibes marketplace.
 *
 * Quick start:
 * ```ts
 * import { AdVibes } from '@advibes/sdk-web'
 *
 * AdVibes.init({ publisherId: 'pub_xxx' })
 * const ad = await AdVibes.showAd('card', 'placement-id')
 * ```
 *
 * Or via script tag:
 * ```html
 * <script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_xxx"></script>
 * ```
 */

export type AdFormat = "card" | "text" | "banner";

export interface AdVibesConfig {
  publisherId: string;
  serverUrl?: string;
  /** @deprecated Use `serverUrl` instead */
  endpoint?: string;
  /** Disable viewer tracking cookie (opt out of retargeting) */
  disableTracking?: boolean;
}

export interface AdUnit {
  id: string;
  impressionId: string;
  format: AdFormat;
  headline: string;
  body?: string;
  ctaText?: string;
  ctaUrl: string;
  imageUrl?: string;
  locale?: string;
  /** True if this ad is from the community exchange (not a paid campaign) */
  isExchange?: boolean;
}

/** Generate a random UUID v4 */
function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Get or create the advibes_vid cookie (first-party, per-domain) */
function getViewerId(disable?: boolean): string | null {
  if (disable) return null;
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/(?:^|;\s*)advibes_vid=([^;]+)/);
  if (match) return match[1];

  const vid = uuid();
  // Set cookie for 1 year, SameSite=Lax for first-party context
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `advibes_vid=${vid}; expires=${expires}; path=/; SameSite=Lax`;
  return vid;
}

/** Monitors ad viewability using IntersectionObserver + dimension checks */
class ViewabilityMonitor {
  private observer: IntersectionObserver | null = null;
  private visibleSince: number | null = null;
  private element: HTMLElement | null = null;
  private impressionId: string | null = null;
  private serverUrl: string;
  private reported = false;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  observe(element: HTMLElement, impressionId: string): void {
    if (typeof IntersectionObserver === "undefined") return;
    this.element = element;
    this.impressionId = impressionId;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.5) {
            if (!this.visibleSince) {
              this.visibleSince = Date.now();
              this.scheduleCheck();
            }
          } else {
            this.visibleSince = null;
          }
        }
      },
      { threshold: [0, 0.5, 1.0] },
    );

    this.observer.observe(element);
  }

  private scheduleCheck(): void {
    setTimeout(() => {
      if (this.reported || !this.visibleSince || !this.element) return;
      const duration = Date.now() - this.visibleSince;
      if (duration >= 1000) {
        this.report();
      }
    }, 1100);
  }

  private report(): void {
    if (this.reported || !this.element || !this.impressionId) return;
    this.reported = true;

    const rect = this.element.getBoundingClientRect();
    const pageActive = typeof document !== "undefined" && !document.hidden;

    fetch(`${this.serverUrl}/v1/exchange/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exchange_impression_id: this.impressionId,
        viewable_percent: Math.round(
          (Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)) /
            rect.height *
            100,
        ),
        viewable_duration_ms: this.visibleSince ? Date.now() - this.visibleSince : 0,
        container_width: Math.round(rect.width),
        container_height: Math.round(rect.height),
        page_active: pageActive,
      }),
    }).catch(() => {});

    this.disconnect();
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

export const AdVibes = {
  _config: null as AdVibesConfig | null,
  _viewerId: null as string | null,
  _monitors: [] as ViewabilityMonitor[],

  /**
   * Initialize the SDK with your publisher credentials.
   */
  init(config: AdVibesConfig): void {
    if (!config.publisherId || config.publisherId === "pub_xxx" || config.publisherId.startsWith("REPLACE")) {
      console.error(
        "[AdVibes] Invalid publisher ID. Get your publisher ID from https://dashboard.advibes.dev\n" +
        "  → Sign up, register your app, then copy your publisher ID from the dashboard.",
      );
    }
    this._config = {
      serverUrl: config.serverUrl ?? config.endpoint ?? "https://ads.advibes.dev",
      ...config,
    };
    this._viewerId = getViewerId(config.disableTracking);
  },

  /**
   * Get the current viewer ID (for custom integrations).
   */
  getViewerId(): string | null {
    return this._viewerId;
  },

  /**
   * Fetch and return an ad for the given placement.
   * Returns null if no ad is available or on error.
   */
  async showAd(
    _format: AdFormat,
    placementId: string,
  ): Promise<AdUnit | null> {
    if (!this._config) {
      console.warn("[AdVibes] SDK not initialized. Call AdVibes.init() first.");
      return null;
    }

    const serverUrl = this._config.serverUrl ?? "https://ads.advibes.dev";

    try {
      const params = new URLSearchParams({
        placement_id: placementId,
      });
      if (this._viewerId) {
        params.set("viewer_id", this._viewerId);
      }

      const res = await fetch(`${serverUrl}/v1/ad?${params.toString()}`);

      if (!res.ok) {
        console.warn(`[AdVibes] Ad request failed with status ${res.status}`);
        return null;
      }

      const data = await res.json() as {
        ad: {
          creative_id: string;
          campaign_id: string;
          format: AdFormat;
          headline: string;
          body: string | null;
          cta_text: string | null;
          cta_url: string;
          image_url: string | null;
          locale: string;
          impression_id: string;
          is_exchange?: boolean;
        } | null;
        reason?: string;
      };

      if (!data.ad) {
        if (data.reason) {
          console.info(`[AdVibes] No ad available for placement "${placementId}": ${data.reason}`);
        }
        return null;
      }

      return {
        id: data.ad.creative_id,
        impressionId: data.ad.impression_id,
        format: data.ad.format,
        headline: data.ad.headline,
        body: data.ad.body ?? undefined,
        ctaText: data.ad.cta_text ?? undefined,
        ctaUrl: data.ad.cta_url,
        imageUrl: data.ad.image_url ?? undefined,
        locale: data.ad.locale,
        isExchange: data.ad.is_exchange ?? false,
      };
    } catch (err) {
      console.warn("[AdVibes] Failed to fetch ad:", err);
      return null;
    }
  },

  /**
   * Start viewability monitoring for an exchange ad.
   * Call this after rendering the ad element in the DOM.
   * The SDK will automatically report viewability to the server.
   */
  monitorViewability(element: HTMLElement, impressionId: string): void {
    if (!this._config) return;
    const serverUrl = this._config.serverUrl ?? "https://ads.advibes.dev";
    const monitor = new ViewabilityMonitor(serverUrl);
    monitor.observe(element, impressionId);
    this._monitors.push(monitor);
  },

  /**
   * Report a click on an ad impression. Used for click tracking.
   * This is a fire-and-forget call; errors are silently logged.
   */
  async reportClick(impressionId: string): Promise<void> {
    if (!this._config) {
      console.warn("[AdVibes] SDK not initialized. Call AdVibes.init() first.");
      return;
    }

    const serverUrl = this._config.serverUrl ?? "https://ads.advibes.dev";

    try {
      await fetch(`${serverUrl}/v1/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impression_id: impressionId }),
      });
    } catch (err) {
      console.warn("[AdVibes] Failed to report click:", err);
    }
  },
};
