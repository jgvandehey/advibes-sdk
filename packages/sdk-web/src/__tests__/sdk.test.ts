import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdVibes } from "../index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(response: {
  ok: boolean;
  status?: number;
  json?: unknown;
}) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: () => Promise.resolve(response.json ?? {}),
  });
}

const SERVER_RESPONSE = {
  ad: {
    creative_id: "cre_123",
    campaign_id: "camp_456",
    format: "card" as const,
    headline: "Test Headline",
    body: "Test body",
    cta_text: "Click me",
    cta_url: "https://example.com",
    image_url: "https://img.example.com/ad.png",
    locale: "en",
    impression_id: "imp_789",
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset SDK state between tests
  AdVibes._config = null;
  AdVibes._viewerId = null;
  vi.restoreAllMocks();
});

describe("AdVibes.init()", () => {
  it("sets config properly", () => {
    AdVibes.init({ publisherId: "pub_test" });

    expect(AdVibes._config).not.toBeNull();
    expect(AdVibes._config!.publisherId).toBe("pub_test");
    expect(AdVibes._config!.serverUrl).toBe("https://ads.advibes.dev");
  });

  it("uses custom serverUrl when provided", () => {
    AdVibes.init({ publisherId: "pub_test", serverUrl: "https://custom.example.com" });

    expect(AdVibes._config!.serverUrl).toBe("https://custom.example.com");
  });
});

describe("AdVibes.showAd()", () => {
  it("warns and returns null if not initialized", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await AdVibes.showAd("card", "pl_abc");

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "[AdVibes] SDK not initialized. Call AdVibes.init() first.",
    );
  });

  it("calls the correct URL with placement_id", async () => {
    const fetchMock = mockFetch({ ok: true, json: SERVER_RESPONSE });
    vi.stubGlobal("fetch", fetchMock);

    AdVibes.init({ publisherId: "pub_test", serverUrl: "https://test.advibes.dev" });
    await AdVibes.showAd("card", "pl_abc");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("https://test.advibes.dev/v1/ad?");
    expect(url).toContain("placement_id=pl_abc");
  });

  it("returns null on non-ok response", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", mockFetch({ ok: false, status: 404 }));

    AdVibes.init({ publisherId: "pub_test" });
    const result = await AdVibes.showAd("card", "pl_abc");

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("[AdVibes] Ad request failed with status 404");
  });

  it("returns properly mapped AdUnit on success", async () => {
    vi.stubGlobal("fetch", mockFetch({ ok: true, json: SERVER_RESPONSE }));

    AdVibes.init({ publisherId: "pub_test" });
    const result = await AdVibes.showAd("card", "pl_abc");

    expect(result).toEqual({
      id: "cre_123",
      impressionId: "imp_789",
      format: "card",
      headline: "Test Headline",
      body: "Test body",
      ctaText: "Click me",
      ctaUrl: "https://example.com",
      imageUrl: "https://img.example.com/ad.png",
      locale: "en",
      isExchange: false,
    });
  });
});

describe("AdVibes.reportClick()", () => {
  it("warns and returns if not initialized", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await AdVibes.reportClick("imp_789");

    expect(warnSpy).toHaveBeenCalledWith(
      "[AdVibes] SDK not initialized. Call AdVibes.init() first.",
    );
  });

  it("sends POST to correct endpoint", async () => {
    const fetchMock = mockFetch({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    AdVibes.init({ publisherId: "pub_test", serverUrl: "https://test.advibes.dev" });
    await AdVibes.reportClick("imp_789");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://test.advibes.dev/v1/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ impression_id: "imp_789" }),
    });
  });
});

describe("AdVibes.getViewerId()", () => {
  it("returns null before init", () => {
    expect(AdVibes.getViewerId()).toBeNull();
  });

  it("returns null when tracking is disabled", () => {
    AdVibes.init({ publisherId: "pub_test", disableTracking: true });
    expect(AdVibes.getViewerId()).toBeNull();
  });
});
