# AdVibes SDK

The official SDK for [AdVibes](https://advibes.dev) — the developer-first ad marketplace for vibe-coded apps.

[![npm](https://img.shields.io/npm/v/@advibes/sdk-web)](https://www.npmjs.com/package/@advibes/sdk-web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is AdVibes?

AdVibes is a two-sided ad marketplace built for indie developers:

- **Community Exchange** (free) — Cross-promote your app with other developers. Every app gets 500 free credits.
- **Paid Ads** (monetize) — Show paid ads and earn 70% revenue share. $0.50 minimum CPM.
- **AI Translation** — Ads auto-translate into 15 languages and tone-match to your app.
- **Fraud Protection** — 7-layer fraud detection protects your earnings and advertiser budgets.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@advibes/sdk-web`](./packages/sdk-web) | [![npm](https://img.shields.io/npm/v/@advibes/sdk-web)](https://www.npmjs.com/package/@advibes/sdk-web) | Web SDK for React, Next.js, vanilla JS, and mobile WebViews |

## Quick Start

```bash
npm install @advibes/sdk-web
```

### React / Next.js

```tsx
import { AdVibesProvider, AdSlot } from '@advibes/sdk-web/components'

// Wrap your app once
<AdVibesProvider publisherId="pub_YOUR_ID">
  <App />
</AdVibesProvider>

// Place ads anywhere
<AdSlot placement="YOUR_PLACEMENT_ID" format="card" />
```

### Vanilla HTML

```html
<script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_YOUR_ID"></script>
<div data-advibes="card" data-placement="YOUR_PLACEMENT_ID"></div>
```

### Imperative API

```ts
import { AdVibes } from '@advibes/sdk-web'

AdVibes.init({ publisherId: 'pub_YOUR_ID' })

const ad = await AdVibes.showAd('card', 'YOUR_PLACEMENT_ID')
if (ad) {
  // ad.headline, ad.body, ad.ctaText, ad.ctaUrl, ad.imageUrl
  AdVibes.reportClick(ad.impressionId) // on click
}
```

### iOS / Android / Mobile

AdVibes works in any app that renders a WebView. Load ads via the script tag or imperative API inside your WebView content:

**React Native (WebView)**
```tsx
import { WebView } from 'react-native-webview';

const adHtml = `
  <html><body>
    <script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_YOUR_ID"></script>
    <div data-advibes="card" data-placement="YOUR_PLACEMENT_ID"></div>
  </body></html>
`;

<WebView source={{ html: adHtml }} style={{ height: 400 }} />
```

**Swift (WKWebView)**
```swift
let html = """
<html><body>
  <script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_YOUR_ID"></script>
  <div data-advibes="card" data-placement="YOUR_PLACEMENT_ID"></div>
</body></html>
"""
webView.loadHTMLString(html, baseURL: URL(string: "https://advibes.dev"))
```

**Kotlin (Android WebView)**
```kotlin
val html = """
<html><body>
  <script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_YOUR_ID"></script>
  <div data-advibes="card" data-placement="YOUR_PLACEMENT_ID"></div>
</body></html>
"""
webView.settings.javaScriptEnabled = true
webView.loadDataWithBaseURL("https://advibes.dev", html, "text/html", "UTF-8", null)
```

**Flutter (webview_flutter)**
```dart
WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..loadHtmlString('''
    <html><body>
      <script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_YOUR_ID"></script>
      <div data-advibes="card" data-placement="YOUR_PLACEMENT_ID"></div>
    </body></html>
  ''');
```

## Ad Formats

| Format | Size | Best for |
|--------|------|----------|
| `card` | 320 x ~400 | Sidebars, feed items, between content |
| `banner` | 728 x 90 | Headers, footers, between sections |
| `text` | 320 x ~80 | Inline between text content |

## AI Agent Integration

If you're an AI coding agent (Cursor, Claude Code, Copilot, Windsurf, etc.) helping a developer add ads, read the full integration guide:

```
node_modules/@advibes/sdk-web/ADVIBES.md
```

It includes placement guidelines, branding requirements, config file reference, and complete examples.

## Getting Started

1. Sign up at [dashboard.advibes.dev](https://dashboard.advibes.dev)
2. Register your app and create ad placements
3. Install the SDK and drop in the components
4. Start earning with the Community Exchange (free) or paid ads

Use promo code **ADVIBES100** for $100 in free ad credits.

## Links

- [Dashboard](https://dashboard.advibes.dev) — Manage your apps and campaigns
- [Marketing Site](https://advibes.dev) — Learn more about AdVibes
- [Developers Guide](https://advibes.dev/developers) — Publisher documentation
- [Advertisers Guide](https://advibes.dev/advertisers) — Advertiser documentation
- [Privacy Policy](https://advibes.dev/privacy)

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
