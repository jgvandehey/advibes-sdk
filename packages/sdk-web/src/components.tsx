"use client";

/**
 * AdVibes React Components
 *
 * Declarative ad placement for React/Next.js apps.
 *
 * Usage:
 * ```tsx
 * import { AdSlot, AdVibesProvider } from '@advibes/sdk-web/components'
 *
 * // Wrap your app
 * <AdVibesProvider publisherId="pub_xxx">
 *   <AdSlot placement="pl_xxx" format="card" />
 * </AdVibesProvider>
 * ```
 */

import { useEffect, useState, useRef, createContext, useContext, useCallback } from "react";
import { AdVibes, type AdUnit, type AdFormat, type AdVibesConfig } from "./index";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AdVibesContextValue {
  ready: boolean;
}

const AdVibesContext = createContext<AdVibesContextValue>({ ready: false });

interface AdVibesProviderProps {
  publisherId: string;
  serverUrl?: string;
  children: React.ReactNode;
}

export function AdVibesProvider({
  publisherId,
  serverUrl,
  children,
}: AdVibesProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AdVibes.init({ publisherId, serverUrl });
    setReady(true);
  }, [publisherId, serverUrl]);

  return (
    <AdVibesContext.Provider value={{ ready }}>
      {children}
    </AdVibesContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// AdSlot — the main component developers drop into their UI
// ---------------------------------------------------------------------------

interface AdSlotProps {
  /** Placement ID from the AdVibes dashboard */
  placement: string;
  /** Ad format to request */
  format: AdFormat;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Show a subtle "Sponsored" label (default: true) */
  showLabel?: boolean;
  /** Fallback content when no ad is available */
  fallback?: React.ReactNode;
  /** Called when an ad loads successfully */
  onLoad?: (ad: AdUnit) => void;
  /** Called when no ad is available */
  onEmpty?: () => void;
}

export function AdSlot({
  placement,
  format,
  className,
  style,
  showLabel = true,
  fallback,
  onLoad,
  onEmpty,
}: AdSlotProps) {
  const { ready } = useContext(AdVibesContext);
  const [ad, setAd] = useState<AdUnit | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function fetchAd() {
      const result = await AdVibes.showAd(format, placement);
      if (cancelled) return;

      setAd(result);
      setLoaded(true);

      if (result) {
        onLoad?.(result);
      } else {
        onEmpty?.();
      }
    }

    fetchAd();
    return () => {
      cancelled = true;
    };
  }, [ready, placement, format, onLoad, onEmpty]);

  // Start viewability monitoring for exchange ads
  useEffect(() => {
    if (!ad?.isExchange || !containerRef.current || !ad.impressionId) return;
    AdVibes.monitorViewability(containerRef.current, ad.impressionId);
  }, [ad]);

  const handleClick = useCallback(() => {
    if (!ad) return;
    AdVibes.reportClick(ad.impressionId);
    window.open(ad.ctaUrl, "_blank", "noopener");
  }, [ad]);

  // Not loaded yet — show nothing
  if (!loaded) return null;

  // No ad available — show fallback or nothing
  if (!ad) return fallback ? <>{fallback}</> : null;

  // Render based on format

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
        borderRadius: format === "banner" ? 8 : 12,
        width: "100%",
        border: "1px solid currentColor",
        borderColor: "color-mix(in srgb, currentColor 20%, transparent)",
        boxSizing: "border-box",
        color: "inherit",
      }}
      data-advibes-placement={placement}
      data-advibes-format={format}
      data-advibes-exchange={ad.isExchange ? "true" : undefined}
    >
      <a
        href={ad.ctaUrl}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        rel="noopener sponsored"
        target="_blank"
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        {format === "banner" ? (
          <BannerAd ad={ad} />
        ) : format === "text" ? (
          <TextAd ad={ad} />
        ) : (
          <CardAd ad={ad} />
        )}
      </a>

      {showLabel && (
        <div
          style={{
            padding: "4px 12px",
            fontSize: 10,
            opacity: 0.5,
            textAlign: "right",
            borderTop: "1px solid",
            borderColor: "color-mix(in srgb, currentColor 15%, transparent)",
          }}
        >
          {ad.isExchange
            ? "Get free ads like this on advibes.dev"
            : "Powered by advibes.dev"}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Format-specific renderers
// ---------------------------------------------------------------------------

function AdImage({ src, height, width, borderRadius }: { src: string; height: number; width?: number | string; borderRadius?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      style={{
        width: width ?? "100%",
        height,
        objectFit: "cover",
        display: "block",
        borderRadius: borderRadius ?? 0,
        flexShrink: 0,
      }}
    />
  );
}

function CardAd({ ad }: { ad: AdUnit }) {
  return (
    <div
      style={{
        overflow: "hidden",
      }}
    >
      {ad.imageUrl && (
        <AdImage src={ad.imageUrl} height={180} />
      )}
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
          {ad.headline}
        </div>
        {ad.body && (
          <div
            style={{
              fontSize: 14,
              opacity: 0.6,
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            {ad.body}
          </div>
        )}
        {ad.ctaText && (
          <div
            style={{
              marginTop: 12,
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {ad.ctaText}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerAd({ ad }: { ad: AdUnit }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {ad.imageUrl && (
        <AdImage src={ad.imageUrl} height={60} width={60} borderRadius={8} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{ad.headline}</div>
        {ad.body && (
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
            {ad.body}
          </div>
        )}
      </div>
      {ad.ctaText && (
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
            color: "white",
            fontSize: 12,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {ad.ctaText}
        </div>
      )}
    </div>
  );
}

function TextAd({ ad }: { ad: AdUnit }) {
  return (
    <div
      style={{
        padding: "10px 16px",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>{ad.headline}</div>
      {ad.body && (
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
          {ad.body}
        </div>
      )}
      {ad.ctaText && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#8b5cf6",
            fontWeight: 500,
          }}
        >
          {ad.ctaText} &rarr;
        </div>
      )}
    </div>
  );
}
