# ADVIBES.md — Agent Integration Guide

> This file is designed for AI coding agents (Cursor, Claude Code, Copilot, etc.)
> to understand how to properly integrate AdVibes ads into an application.
> If you are an AI agent helping a developer add ads to their app, read this file first.

## What is AdVibes?

AdVibes is an ad marketplace for vibe-coded apps. Publishers (app developers) show ads and earn revenue. Advertisers create campaigns that serve across the network. Ads are auto-translated into the user's language and tone-matched to the host app.

---

## For AI Agents: How to Integrate

When a developer asks you to "add ads" or "monetize" their app, follow this flow:

### Step 1: Check for existing config

Look for `advibes.config.ts` in the project root. If it exists, read it — it tells you the developer's preferences for ad formats, placements, restricted pages, and styling. Use those preferences when placing ads.

### Step 2: Choose the right integration method

| App type | Method | Import |
|----------|--------|--------|
| React / Next.js | `<AdSlot>` component | `@advibes/sdk-web/components` |
| Vanilla JS / HTML | Data attributes | `@advibes/sdk-web/auto` |
| Any JS framework | Imperative API | `@advibes/sdk-web` |

### Step 3: Create or update advibes.config.ts

If the project doesn't have an `advibes.config.ts`, create one:

```ts
// advibes.config.ts
import { defineAdVibesConfig } from '@advibes/sdk-web/config'

export default defineAdVibesConfig({
  publisherId: 'REPLACE_WITH_PUBLISHER_ID',
  app: {
    name: 'My App',
    category: 'productivity',  // social | productivity | entertainment | education | ecommerce | health | finance | travel | news | other
    platform: 'web',
  },
  ads: {
    formats: ['card', 'banner'],      // formats the developer is OK with
    maxPerPage: 2,                     // max ads per page
    placements: [
      // Declare where ads should go — you fill these in based on the app's layout
      {
        id: 'REPLACE_WITH_PLACEMENT_ID',
        format: 'card',
        location: 'sidebar',
        description: 'Right sidebar below navigation',
      },
    ],
  },
  restrictions: {
    noAdsOnPages: ['/login', '/signup', '/checkout', '/settings'],
    blockedCategories: [],
    requireConsent: false,             // set true for EU/UK apps
  },
  style: {
    theme: 'dark',                     // match the app's theme
    accentColor: '#8b5cf6',
    borderRadius: 12,
    showBrandingLabel: true,
  },
})
```

**Important:** The `publisherId` and placement `id` values need to come from the AdVibes dashboard. If the developer hasn't set these up yet, leave them as `REPLACE_WITH_*` placeholders and tell the developer to:
1. Sign up at https://dashboard.advibes.dev
2. Register their app
3. Create ad placements
4. Replace the placeholder values

### Use components directly

Import `<AdVibesProvider>` and `<AdSlot>` from `@advibes/sdk-web/components` and use them directly in your pages. Wrapping `<AdSlot>` in layout containers (`<div>`, `<aside>`, etc.) for positioning is fine. Just don't re-export or re-implement the component logic (e.g., don't create your own `AdSlot.tsx` that copies the API). The SDK components handle viewability tracking, click reporting, and branding automatically.

### Step 4: Place the ads

Read the config and place ads where the developer specified. If no config exists, use your best judgment based on the app layout and the placement guidelines below.

---

## Integration Method 1: React Components (Recommended for React/Next.js)

### Setup

```tsx
// In your root layout or App component
import { AdVibesProvider } from '@advibes/sdk-web/components'

export default function Layout({ children }) {
  return (
    <AdVibesProvider publisherId="pub_xxx">
      {children}
    </AdVibesProvider>
  )
}
```

### Place ads

```tsx
import { AdSlot } from '@advibes/sdk-web/components'

// Card ad in a sidebar
<AdSlot placement="pl_sidebar" format="card" />

// Banner ad above the footer
<AdSlot placement="pl_footer" format="banner" />

// Text ad between content sections
<AdSlot placement="pl_inline" format="text" />

// With options
<AdSlot
  placement="pl_xxx"
  format="card"
  className="my-4"
  showLabel={true}
  fallback={<div>Support us!</div>}
  onLoad={(ad) => console.log('Ad loaded:', ad.headline)}
  onEmpty={() => console.log('No ad available')}
/>
```

### AdSlot Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placement` | `string` | required | Placement ID from dashboard |
| `format` | `'card' \| 'text' \| 'banner'` | required | Ad format |
| `className` | `string` | — | CSS class for container |
| `style` | `CSSProperties` | — | Inline styles |
| `showLabel` | `boolean` | `true` | Show branding label (required by ToS) |
| `fallback` | `ReactNode` | — | Content when no ad available |
| `onLoad` | `(ad) => void` | — | Callback when ad loads |
| `onEmpty` | `() => void` | — | Callback when no ad available |

---

## Integration Method 2: Data Attributes (Vanilla HTML/JS)

No framework needed. Just add data attributes and include the script.

### Setup

```html
<script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_xxx"></script>
```

Or with npm:

```ts
import { AdVibes } from '@advibes/sdk-web'
import { discoverSlots } from '@advibes/sdk-web/auto'

AdVibes.init({ publisherId: 'pub_xxx' })
discoverSlots()
```

### Place ads

```html
<!-- Card ad in sidebar -->
<div data-advibes="card" data-placement="pl_sidebar"></div>

<!-- Banner ad -->
<div data-advibes="banner" data-placement="pl_footer"></div>

<!-- Text ad -->
<div data-advibes="text" data-placement="pl_inline"></div>
```

### Data attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-advibes` | yes | Ad format: `card`, `text`, or `banner` |
| `data-placement` | yes | Placement ID from dashboard |
| `data-advibes-label` | no | Set `"false"` to hide "Sponsored" label |
| `data-advibes-fallback` | no | `"hide"` (default) or `"keep"` container when no ad |

---

## Integration Method 3: Imperative API

For full control — use the core SDK directly.

```ts
import { AdVibes } from '@advibes/sdk-web'

AdVibes.init({ publisherId: 'pub_xxx' })

const ad = await AdVibes.showAd('card', 'pl_xxx')

if (ad) {
  // ad.headline    — main text
  // ad.body        — optional description
  // ad.ctaText     — button label
  // ad.ctaUrl      — click destination
  // ad.imageUrl    — optional image (may be null or fail to load)
  // ad.impressionId — for click tracking
  // ad.isExchange  — true if this is a community exchange ad

  // Render however you want, then on click:
  AdVibes.reportClick(ad.impressionId)
}
```

### Handling Missing or Broken Images

`ad.imageUrl` is **optional and may be null**. Even when a URL is present, it may fail to load (broken link, timeout, etc.). Your rendering code MUST handle both cases gracefully:

**Card format (large image area):**
- If `imageUrl` is null → skip the image area entirely, render text-only layout
- If the image fails to load → hide the image area (don't show a broken image icon or empty placeholder)

**Banner format (small thumbnail):**
- If `imageUrl` is null or fails to load → show a branded fallback thumbnail (e.g., a gradient square with the first letter of the headline)
- Do NOT show an empty gray box or broken image icon

**Example (React):**
```tsx
function AdImage({ src, height }: { src: string; height: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt="" onError={() => setFailed(true)} style={{ width: "100%", height, objectFit: "cover" }} />;
}

// In your card renderer:
{ad.imageUrl && <AdImage src={ad.imageUrl} height={180} />}
```

**Example (SwiftUI):**
```swift
AsyncImage(url: url) { phase in
  switch phase {
  case .success(let image):
    image.resizable().aspectRatio(contentMode: .fill).frame(maxHeight: 160).clipped()
  case .failure:
    EmptyView() // Hide on failure
  default:
    ProgressView() // Loading state
  }
}
```

---

## Creative Images for Advertisers

When a developer is creating ad campaigns (not just showing ads), their creatives need high-quality images. Here are the recommended sizes:

| Format | Image Size | Aspect Ratio | Notes |
|--------|-----------|--------------|-------|
| `card` | 640 x 480 | 4:3 | Hero image above headline. Min 320px wide. |
| `banner` | 1456 x 180 | ~8:1 | Full-width horizontal strip. Min 728px wide. |
| `banner` thumbnail | 180 x 180 | 1:1 | Optional square thumbnail on left side of banner. |

### Image best practices for agents:

- **Use existing app screenshots or logos** from the project's `public/` folder when available
- **Prefer `.png` or `.webp`** for UI screenshots, `.jpg` for photos
- **Minimum resolution**: 2x the display size (e.g., 1280x960 for a 640x480 card image)
- **Keep file size under 500KB** — compress with tools like `sharp`, `squoosh`, or `imagemin`
- **If no suitable image exists**, suggest the developer add one to their repo (e.g., `public/images/ad-hero.png`) and reference it via a public URL or upload it through the AdVibes dashboard

### Where to find images in a project:

Look in these common locations for existing assets to use:
- `public/` or `public/images/`
- `assets/` or `src/assets/`
- `static/`
- App icons, OG images, or hero images
- README screenshots

---

## Branding & Attribution (Required)

Every ad response from the AdVibes API includes a `branding` object. **You MUST display the branding label** — this is AdVibes attribution and is required by our terms of service.

### API response branding object

```json
{
  "ad": { ... },
  "branding": {
    "label": "Powered by advibes.dev",
    "cta_gradient": "linear-gradient(135deg, #8b5cf6, #d946ef)",
    "cta_color": "#8b5cf6",
    "logo_url": "https://advibes.dev/AdVibes_logo.png"
  }
}
```

For community exchange ads, the label will be `"Get free ads like this on advibes.dev"`.

### What you MUST do:

- **Display `branding.label`** somewhere on the ad (e.g., small text below the CTA). This is required.

### What you MAY customize:

- **CTA button styling** — you can use your app's own button styles instead of `branding.cta_gradient`. Making the ad feel native to your app is encouraged.
- **Label positioning** — place the label where it fits your layout (bottom-right, below the ad, etc.) as long as it's legible.

### What you MUST NOT do:

- Remove or hide the branding label
- Replace it with different text
- Make it invisible (e.g., 0 opacity, display:none, matching background color)

### For agents using the built-in SDK components:

The `<AdSlot>` component and data-attribute integrations handle branding automatically — no extra work needed. This section only applies if you're using the imperative API and rendering ads yourself.

---

## Ad Formats

| Format   | Size          | Visual                     | Best Placement              |
|----------|---------------|----------------------------|-----------------------------|
| `card`   | 320 x ~400    | Optional image + headline + body + CTA | Sidebars, feed items, end of content |
| `text`   | 320 x ~80     | Text only, no image        | Inline between content, lists |
| `banner` | 728 x 90      | Horizontal strip with optional thumbnail + CTA | Header, footer, between sections |

> **Note:** Images are optional for `card` and `banner` formats. Your UI must render correctly with or without an image. See "Handling Missing or Broken Images" above.

### Format Selection Guide for Agents

When deciding which format to use, analyze the app's layout:

- **Has a sidebar?** → `card` in the sidebar
- **Has a content feed or list?** → `text` between items, or `card` every N items
- **Has a header/footer area?** → `banner`
- **Single-column layout?** → `text` between sections, or `banner` at top/bottom
- **Dashboard with cards/widgets?** → `card` as one of the widgets
- **Blog or article?** → `text` mid-article, `banner` after the article

---

## Where to Place Ads (Agent Decision Guide)

### Recommended locations (pick 1-3):

1. **Sidebar** — card format, below navigation or after main sidebar content
2. **Between content sections** — text or banner, with spacing above and below
3. **End of main content** — card or banner, before the footer
4. **Feed/list items** — text or card every 5-10 items
5. **Below the fold** — banner, after the first screenful of content

### Pages to AVOID placing ads:

- Login / signup / auth pages
- Checkout / payment pages
- Settings / account pages
- Error pages (404, 500)
- Onboarding flows
- Modal/dialog interiors

### Spacing rules:

- At least 16px margin around ad slots
- At least one content section between ad placements
- Never more than 3 ads on a single page
- Never place directly adjacent to primary CTA buttons

---

## Before You Start: Required Disclosures

**You MUST ensure the app has these in place before showing ads:**

### 1. Privacy Policy

The app's privacy policy must disclose:
- That the app displays third-party advertisements via AdVibes
- That anonymous impression and click data is collected for ad delivery and reporting
- That a viewer fingerprint (non-PII) may be generated for frequency capping
- No personal data is shared with advertisers

Example clause (add to existing privacy policy):
```
This app displays advertisements served by AdVibes (advibes.dev). AdVibes collects
anonymous usage data including ad impressions and clicks for the purpose of ad delivery,
frequency capping, and performance reporting. No personally identifiable information
is shared with advertisers. For more information, see https://advibes.dev/privacy.
```

### 2. Terms of Service

Add to existing terms:
```
This application displays advertising content from third-party advertisers via the
AdVibes ad network. Ad content is provided by third parties and is not endorsed by
[App Name]. If you encounter inappropriate advertising, please contact us.
```

### 3. Cookie/Tracking Consent (EU/UK Apps)

If the app serves users in the EU/UK:
- Show a consent banner before initializing the AdVibes SDK
- Only call `AdVibes.init()` or render `<AdVibesProvider>` after consent is granted
- Set `restrictions.requireConsent: true` in `advibes.config.ts`

---

## Config File Reference: advibes.config.ts

The config file lives in the project root. Agents should read it to understand preferences and update it when adding new placements.

```ts
import { defineAdVibesConfig } from '@advibes/sdk-web/config'

export default defineAdVibesConfig({
  // REQUIRED: Publisher ID from AdVibes dashboard
  publisherId: 'pub_xxx',

  // Optional: custom ad server URL (defaults to https://ads.advibes.dev)
  serverUrl: 'https://ads.advibes.dev',

  // App metadata — helps agents understand the app context
  app: {
    name: 'My App',
    category: 'productivity',
    platform: 'web',
  },

  // Ad configuration
  ads: {
    // Formats the developer approves for their app
    // Agent: only use formats listed here
    formats: ['card', 'banner', 'text'],

    // Maximum ads per page — agent should respect this limit
    maxPerPage: 2,

    // Declared ad placements
    // Each placement needs a corresponding placement in the AdVibes dashboard
    placements: [
      {
        id: 'pl_xxx',          // from dashboard
        format: 'card',        // card | text | banner
        location: 'sidebar',   // descriptive label for where in the UI
        description: 'Right sidebar below the nav menu',
      },
      {
        id: 'pl_yyy',
        format: 'banner',
        location: 'footer',
        description: 'Horizontal banner above the page footer',
      },
    ],
  },

  // Restrictions — agent MUST respect these
  restrictions: {
    // Routes where ads should NOT appear
    noAdsOnPages: ['/login', '/signup', '/checkout', '/settings'],

    // Ad categories to block (empty = allow all)
    blockedCategories: [],

    // Whether to require user consent before showing ads
    requireConsent: false,
  },

  // Visual customization
  style: {
    theme: 'dark',           // 'dark' | 'light' | 'auto'
    accentColor: '#8b5cf6',  // CTA button gradient base
    borderRadius: 12,        // border radius in px
    showBrandingLabel: true, // show "Sponsored" badge
  },
})
```

### Agent workflow for advibes.config.ts:

1. **Read config first** — before placing any ads
2. **Respect `formats`** — only use formats the developer approved
3. **Respect `maxPerPage`** — don't exceed the limit
4. **Respect `noAdsOnPages`** — skip those routes entirely
5. **Use `placements`** — place ads where declared; if adding new ones, update the config
6. **Match `style.theme`** — to the app's existing look

---

## Revenue Model

- Publishers earn **70% of the CPM** bid from advertisers
- Revenue = (impressions x CPM bid x 0.70) / 1000
- Minimum payout: $25 via Stripe Connect
- Set up payouts in Dashboard > Settings > Payout Settings

---

## Complete Example: Next.js App

```tsx
// advibes.config.ts
import { defineAdVibesConfig } from '@advibes/sdk-web/config'

export default defineAdVibesConfig({
  publisherId: 'pub_abc123',
  app: { name: 'TaskFlow', category: 'productivity', platform: 'web' },
  ads: {
    formats: ['card', 'banner'],
    maxPerPage: 2,
    placements: [
      { id: 'pl_sidebar_1', format: 'card', location: 'sidebar', description: 'Dashboard sidebar' },
      { id: 'pl_footer_1', format: 'banner', location: 'footer', description: 'Below main content' },
    ],
  },
  restrictions: {
    noAdsOnPages: ['/login', '/signup', '/settings', '/billing'],
    requireConsent: false,
  },
  style: { theme: 'dark', showBrandingLabel: true },
})
```

```tsx
// app/layout.tsx
import { AdVibesProvider } from '@advibes/sdk-web/components'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AdVibesProvider publisherId="pub_abc123">
          {children}
        </AdVibesProvider>
      </body>
    </html>
  )
}
```

```tsx
// components/sidebar.tsx
import { AdSlot } from '@advibes/sdk-web/components'

export function Sidebar() {
  return (
    <aside>
      <nav>{/* navigation items */}</nav>
      <div className="mt-6">
        <AdSlot placement="pl_sidebar_1" format="card" />
      </div>
    </aside>
  )
}
```

```tsx
// components/footer.tsx
import { AdSlot } from '@advibes/sdk-web/components'

export function Footer() {
  return (
    <>
      <div className="my-4">
        <AdSlot placement="pl_footer_1" format="banner" />
      </div>
      <footer>{/* footer content */}</footer>
    </>
  )
}
```

---

## Complete Example: Vanilla HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.advibes.dev/v1/sdk.js" data-publisher="pub_abc123"></script>
</head>
<body>
  <div class="layout">
    <main>
      <h1>Welcome to my app</h1>
      <p>Content here...</p>

      <!-- Text ad between content -->
      <div data-advibes="text" data-placement="pl_inline_1" style="margin: 16px 0"></div>

      <p>More content...</p>
    </main>

    <aside>
      <!-- Card ad in sidebar -->
      <div data-advibes="card" data-placement="pl_sidebar_1"></div>
    </aside>
  </div>

  <!-- Banner ad above footer -->
  <div data-advibes="banner" data-placement="pl_footer_1" style="margin: 16px 0"></div>

  <footer>Footer content</footer>
</body>
</html>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `showAd` returns `null` | No ads available for your placement. Check that your app is active and has an active placement on the dashboard. |
| SDK not initialized warning | Call `AdVibes.init()` or use `<AdVibesProvider>` before showing ads. |
| Ads not matching app language | Ads auto-translate based on the app's locale setting in the dashboard. |
| Low fill rate | Ensure your app category and targeting are set correctly in the dashboard. More placements = more fill. |
| `REPLACE_WITH_*` in config | Developer needs to create an account and placements at https://dashboard.advibes.dev |

---

## Machine-Readable Metadata

For programmatic discovery:

| Endpoint | URL | Content |
|----------|-----|---------|
| llms.txt | `https://advibes.dev/llms.txt` | This file as plain text |
| advibes.json | `https://advibes.dev/.well-known/advibes.json` | SDK details, formats, API endpoints |
| Agent docs | `https://advibes.dev/docs/agent-integration` | Rendered HTML version of this file |
| npm package | `node_modules/@advibes/sdk-web/ADVIBES.md` | This file, shipped with the SDK |

---

## Support

- Dashboard: https://dashboard.advibes.dev
- Free $100 ad credit: Use coupon code `ADVIBES100`
- Issues: https://github.com/advibes/sdk-web
