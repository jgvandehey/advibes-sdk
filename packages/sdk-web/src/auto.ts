/**
 * AdVibes Auto-Discovery
 *
 * Automatically finds and fills ad slots declared with data attributes.
 * Works with any HTML — no framework required.
 *
 * Usage:
 * 1. Add the script tag:
 *    <script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_xxx"></script>
 *
 * 2. Place ad slots in your HTML:
 *    <div data-advibes="card" data-placement="pl_xxx"></div>
 *    <div data-advibes="banner" data-placement="pl_yyy"></div>
 *    <div data-advibes="text" data-placement="pl_zzz"></div>
 *
 * The SDK will auto-discover all [data-advibes] elements and fill them with ads.
 *
 * Optional attributes:
 *   data-advibes-label="false"    — hide the "Sponsored" label
 *   data-advibes-fallback="hide"  — hide the container if no ad (default)
 *   data-advibes-fallback="keep"  — keep the container visible if no ad
 */

import { AdVibes, type AdFormat, type AdUnit } from "./index";

function renderAd(container: HTMLElement, ad: AdUnit, format: AdFormat) {
  const showLabel = container.dataset.advibesLabel !== "false";

  container.style.position = "relative";
  container.innerHTML = "";

  // Label
  if (showLabel) {
    const label = document.createElement("span");
    label.textContent = ad.isExchange
      ? "Get free ads like this on advibes.dev"
      : "Powered by advibes.dev";
    Object.assign(label.style, {
      position: "absolute",
      top: "4px",
      right: "4px",
      fontSize: "10px",
      color: "#888",
      background: "rgba(0,0,0,0.5)",
      padding: "1px 6px",
      borderRadius: "4px",
      zIndex: "1",
    });
    container.appendChild(label);
  }

  // Clickable wrapper
  const link = document.createElement("a");
  link.href = ad.ctaUrl;
  link.target = "_blank";
  link.rel = "noopener sponsored";
  Object.assign(link.style, {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
  });
  link.addEventListener("click", (e) => {
    e.preventDefault();
    AdVibes.reportClick(ad.impressionId);
    window.open(ad.ctaUrl, "_blank", "noopener");
  });

  if (format === "card") {
    link.innerHTML = `
      <div style="border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;max-width:320px">
        ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="" style="width:100%;height:180px;object-fit:cover;display:block">` : ""}
        <div style="padding:16px">
          <div style="font-weight:600;font-size:16px;line-height:1.3">${esc(ad.headline)}</div>
          ${ad.body ? `<div style="font-size:14px;color:#aaa;margin-top:6px;line-height:1.4">${esc(ad.body)}</div>` : ""}
          ${ad.ctaText ? `<div style="margin-top:12px;display:inline-block;padding:6px 16px;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#d946ef);color:white;font-size:13px;font-weight:500">${esc(ad.ctaText)}</div>` : ""}
        </div>
      </div>
    `;
  } else if (format === "banner") {
    link.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;padding:12px 20px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;max-width:728px">
        ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0">` : ""}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px">${esc(ad.headline)}</div>
          ${ad.body ? `<div style="font-size:12px;color:#aaa;margin-top:2px">${esc(ad.body)}</div>` : ""}
        </div>
        ${ad.ctaText ? `<div style="padding:6px 14px;border-radius:6px;background:linear-gradient(135deg,#8b5cf6,#d946ef);color:white;font-size:12px;font-weight:500;flex-shrink:0">${esc(ad.ctaText)}</div>` : ""}
      </div>
    `;
  } else {
    // text
    link.innerHTML = `
      <div style="padding:10px 16px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;max-width:320px">
        <div style="font-weight:600;font-size:14px">${esc(ad.headline)}</div>
        ${ad.body ? `<div style="font-size:13px;color:#aaa;margin-top:4px">${esc(ad.body)}</div>` : ""}
        ${ad.ctaText ? `<div style="margin-top:8px;font-size:12px;color:#8b5cf6;font-weight:500">${esc(ad.ctaText)} &rarr;</div>` : ""}
      </div>
    `;
  }

  container.appendChild(link);
}

function esc(s: string): string {
  const el = document.createElement("span");
  el.textContent = s;
  return el.innerHTML;
}

/**
 * Scan the DOM for [data-advibes] elements and fill them with ads.
 * Call this after AdVibes.init() or it runs automatically on DOMContentLoaded.
 */
export async function discoverSlots() {
  const slots = document.querySelectorAll<HTMLElement>("[data-advibes]");

  const promises = Array.from(slots).map(async (el) => {
    const format = el.dataset.advibes as AdFormat;
    const placementId = el.dataset.placement;

    if (!placementId) {
      console.warn("[AdVibes] Slot missing data-placement attribute:", el);
      return;
    }

    if (!["card", "text", "banner"].includes(format)) {
      console.warn(`[AdVibes] Unknown format "${format}" on slot:`, el);
      return;
    }

    const ad = await AdVibes.showAd(format, placementId);
    if (ad) {
      renderAd(el, ad, format);
      // Start viewability monitoring for exchange ads
      if (ad.isExchange && ad.impressionId) {
        AdVibes.monitorViewability(el, ad.impressionId);
      }
    } else {
      const fallback = el.dataset.advibesFallback;
      if (fallback !== "keep") {
        el.style.display = "none";
      }
    }
  });

  await Promise.all(promises);
}

// Auto-run on DOMContentLoaded if the script tag has data-publisher
if (typeof document !== "undefined") {
  const script = document.currentScript as HTMLScriptElement | null;
  if (script?.dataset.publisher) {
    AdVibes.init({ publisherId: script.dataset.publisher });

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => discoverSlots());
    } else {
      discoverSlots();
    }
  }
}
