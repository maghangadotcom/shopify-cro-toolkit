# Shopify CRO Toolkit

Production-tested Liquid sections, JavaScript utilities and performance patterns for Shopify stores that need to convert better and load faster.

Built from real CRO experiments on 7-9 figure DTC subscription brands. Every snippet here was written to solve a specific conversion problem, not to demo a feature.

## What this is

A growing collection of code I write while running CRO for Shopify stores. Instead of letting useful patterns die in client repos, I extract the reusable parts and put them here.

The toolkit covers three areas that matter most for conversion rate optimization on Shopify:

**Liquid sections** - Custom section templates with full schema configurations. Drag-and-drop from the Theme Editor. No developer needed after the initial install.

**JavaScript utilities** - Cart interceptors, quantity nudges, sticky add-to-cart bars, progress bars and dynamic pricing displays. All built on the Shopify Ajax API. All mobile-first.

**Performance patterns** - Image optimization scripts, CLS prevention techniques, lazy loading implementations and Core Web Vitals fixes. Because a 4-second LCP kills conversion before your copy even loads.

## Why this exists

Most Shopify CRO work happens in private repos behind NDAs. The patterns get rebuilt from scratch on every new project. That is a waste.

I have spent 4+ years building, fixing and scaling storefronts for high-growth DTC brands. The same problems keep showing up: slow hero images, cart drawers that do not upsell, product pages that bury social proof below the fold and subscription flows that create friction instead of reducing it.

This repo is my attempt to make those solutions portable. If you run CRO on Shopify stores, you should be able to drop these in and adapt them to your brand without starting from zero.

## Repository structure

```
shopify-cro-toolkit/
├── liquid-sections/
│   ├── comparison-table/         # Us vs Them responsive table section
│   ├── faq-accordion/            # Accessible FAQ with schema.org markup
│   ├── founder-story/            # ATF founder trust element for cold traffic
│   ├── social-proof-bar/         # Review count + rating + trust badges
│   ├── subscription-hero/        # Subscription-first buy box layout
│   ├── value-stack/              # Visual breakdown of bundle contents
│   └── listicle-template/        # 7-reason listicle page template
│
├── js-utils/
│   ├── cart-interceptor.js       # Ajax cart event listener and modifier
│   ├── quantity-nudge.js         # Dynamic quantity upsell in cart drawer
│   ├── order-bump.js             # Add complementary product from cart
│   ├── sticky-atc.js             # Mobile sticky add-to-cart bar
│   ├── free-shipping-bar.js      # Progressive threshold calculator
│   ├── dynamic-pricing.js        # Real-time price update on variant change
│   └── subscription-toggle.js    # One-time vs subscription switcher
│
├── analytics/
│   ├── gtm-custom-events.js      # GTM triggers for CRO-specific events
│   ├── ga4-ecommerce-helpers.js  # GA4 enhanced e-commerce event formatting
│   ├── scroll-depth-tracker.js   # Section-level scroll tracking
│   └── clarity-event-tags.js     # Microsoft Clarity custom event tagging
│
├── performance/
│   ├── image-preload.liquid      # Hero image preload with WebP/AVIF fallback
│   ├── cls-prevention.css        # Aspect ratio reservations for all containers
│   ├── lazy-load-sections.js     # Intersection Observer for below-fold content
│   ├── critical-css-inline.liquid # Inline critical path CSS
│   └── third-party-audit.md      # App bloat identification checklist
│
├── snippets/
│   ├── responsive-image.liquid   # Srcset + sizes with next-gen format support
│   ├── money-format.liquid       # Currency formatting with locale support
│   ├── trust-badge.liquid        # Configurable trust/guarantee badge
│   └── countdown-timer.liquid    # Lightweight countdown without dependencies
│
└── docs/
    ├── INSTALLATION.md           # How to add sections to your theme
    ├── TESTING-GUIDE.md          # Setting up A/B tests with Intelligems
    ├── PERFORMANCE-CHECKLIST.md  # Core Web Vitals audit process
    └── SECTION-SCHEMA-GUIDE.md   # Writing configurable section schemas
```

## Quick start

### Adding a Liquid section to your theme

1. Copy the section folder (e.g. `liquid-sections/faq-accordion/`) into your theme's `sections/` directory
2. Copy any associated snippets from `snippets/` into your theme's `snippets/` directory
3. Add the section to your page template via the Theme Editor or by editing the JSON template directly

Every section includes a `schema` block with configurable settings. Marketers can update content, images and copy without touching code.

### Using a JavaScript utility

Most JS utilities are standalone and dependency-free. They use the native Shopify Ajax API.

```html
<!-- Add to your theme.liquid or section file -->
<script src="{{ 'cart-interceptor.js' | asset_url }}" defer></script>
```

Or copy the relevant functions into your existing JavaScript bundle. Each file documents its dependencies and expected DOM structure at the top.

### Performance patterns

The performance folder contains both code files and documentation. Start with `PERFORMANCE-CHECKLIST.md` for an audit framework, then apply the specific fixes as needed.

## What is inside

### Liquid sections

**comparison-table/** - A responsive Us vs Them comparison table built for product pages and listicles. Configurable rows, custom icons and mobile-optimized layout that stacks cleanly on small screens. Schema supports up to 12 comparison points with individual check/cross icons per row.

**faq-accordion/** - Accessible accordion section with proper ARIA attributes and schema.org FAQPage markup for SEO. Each FAQ item is a block in the Theme Editor. Supports rich text answers with links and formatting.

**founder-story/** - Above-the-fold trust element designed for cold traffic. Displays the founder's photo, a short origin story and a credibility statement. Built to address the primary conversion blocker for health and wellness brands: trust before understanding. Configurable via the Theme Editor with image, heading, body text and CTA fields.

**social-proof-bar/** - Inline review count, star rating and trust badges. Pulls data from metafields so it stays in sync with your review platform. Designed to sit directly under the product title where it has the highest impact on perceived credibility.

**subscription-hero/** - A buy box variant that makes the subscription the visual and logical default. One-time purchase is available but secondary. Includes a pause anytime reassurance line, per-serving price breakdown and savings callout. Built for subscription-first brands that want to shift attach rates without adding friction.

**value-stack/** - Visual breakdown of what is included in a bundle or kit. Supports individual images, descriptions and savings per item. Designed to justify price by making the total value feel greater than the sum of the parts.

**listicle-template/** - A full page template (`page.listicle.liquid`) for pre-sale education pages. Structured as a 7-reason persuasion sequence with configurable sections for headline, comparison table, individual reasons with media support and a bridging CTA. Built for cold traffic that needs belief-shifting before seeing the price.

### JavaScript utilities

**cart-interceptor.js** - Listens for all add-to-cart events across the store and provides hooks for modification before the request completes. Use it to inject upsells, modify quantities, add properties or trigger analytics events. Works with native Shopify forms and Ajax submissions.

```javascript
// Example: log every add-to-cart event
CartInterceptor.on('add', (item) => {
  console.log(`Added ${item.title} x${item.quantity}`);
  // Trigger your upsell logic, analytics, etc.
});
```

**quantity-nudge.js** - Detects the current cart contents and displays a contextual upsell message. If a customer has 1 unit, show a Save 15% with 3 message. If they have 2, nudge toward the bundle threshold. Configurable tiers, messages and discount percentages.

**order-bump.js** - Adds a one-click complementary product offer in the cart drawer. Configurable product pairings (if Product A is in cart, suggest Product B). Uses the Ajax API to add without page reload. Includes a dismiss handler that respects the user's choice via sessionStorage.

**sticky-atc.js** - Mobile sticky add-to-cart bar that appears when the main buy box scrolls out of the viewport. Includes product title, price, variant selector and add-to-cart button. Uses Intersection Observer for performance. Respects the thumb zone with bottom positioning and minimum 48px tap targets.

**free-shipping-bar.js** - Calculates `threshold - currentCartValue` in real-time and displays a progress bar. Updates on every cart change via the Ajax API. Configurable threshold, currency formatting and completion message. Proven AOV lifter on every store I have tested it on.

**dynamic-pricing.js** - Updates the displayed price, compare-at price and savings percentage when the customer switches between variants, quantities or purchase types (one-time vs subscription). No page reload. No layout shift.

**subscription-toggle.js** - Handles the UI logic for switching between one-time purchase and subscription in the buy box. Updates price, savings display, delivery frequency selector visibility and any subscription-specific messaging. Works with Skio, Recharge and native Shopify subscriptions.

### Analytics

**gtm-custom-events.js** - Fires custom GTM dataLayer events for CRO-specific interactions that default Shopify tracking misses. Includes: scroll depth by section, buy box interactions, subscription toggle clicks, FAQ accordion opens, cart drawer engagement and upsell offer views/clicks.

**ga4-ecommerce-helpers.js** - Formats Shopify product and cart data into GA4 enhanced e-commerce event structures. Handles `view_item`, `add_to_cart`, `begin_checkout` and `purchase` with proper item arrays, currency and value fields.

**scroll-depth-tracker.js** - Tracks how far users scroll on product pages and landing pages. Fires events at configurable percentage thresholds and when specific sections enter the viewport. Critical for identifying which PDP sections actually get seen.

**clarity-event-tags.js** - Sends custom events to Microsoft Clarity for session recording segmentation. Tag sessions by user actions (viewed subscription option, clicked FAQ, used quantity selector) so you can filter recordings by behavior.

### Performance

**image-preload.liquid** - Snippet for preloading the hero/LCP image with `<link rel="preload">`. Includes srcset for responsive loading and format negotiation for WebP/AVIF. Drop it into your `<head>` for your most critical above-the-fold image.

**cls-prevention.css** - CSS aspect ratio rules for every common container type on a Shopify store: product images, collection cards, announcement bars, review widgets and hero sections. Prevents layout shift by reserving exact dimensions before content loads.

**lazy-load-sections.js** - Uses Intersection Observer to defer loading of below-fold sections. Instead of rendering everything on page load, sections initialize only when they approach the viewport. Reduces initial JavaScript execution time and DOM size.

**critical-css-inline.liquid** - Template for inlining the critical CSS path directly in the `<head>`. Covers above-the-fold styles for the hero, navigation and buy box so the first paint does not wait for the full stylesheet.

**third-party-audit.md** - A structured checklist for identifying which installed Shopify apps are adding render-blocking scripts, excessive DOM nodes or redundant JavaScript. Includes the exact Chrome DevTools steps and Lighthouse flags to look for.

## Principles

These are the rules everything in this repo follows.

**Mobile-first, always.** 70%+ of DTC traffic comes from mobile devices, often through in-app browsers on Instagram and TikTok with degraded performance. Every element is built for a 375px viewport on a slow connection first. Desktop is the enhancement.

**No dependencies.** Nothing in this repo requires jQuery, React or any external library. Vanilla JavaScript, native Shopify Liquid and standard CSS. If you need it to work, it works. No bundler required.

**Schema-driven.** Every Liquid section includes a full `{% schema %}` block with typed settings, block definitions and presets. The goal is that after the initial install, a marketer can update content through the Theme Editor without filing a dev ticket.

**Performance is conversion.** A study of 100 million sessions showed that a store loading in 1 second converts at 3x the rate of one loading in 4 seconds. Every pattern in this repo is written with Core Web Vitals in mind. If a feature adds more than 50ms to LCP, it gets rewritten or dropped.

**Test everything.** These patterns are starting points, not finished products. The real value comes from A/B testing them against your current implementation. The `docs/TESTING-GUIDE.md` covers how to set up controlled experiments with Intelligems on Shopify.

## Tech stack

- Shopify Online Store 2.0 (JSON templates, section architecture)
- Shopify Liquid
- Vanilla JavaScript (ES6+)
- Shopify Ajax API (`/cart/add.js`, `/cart/update.js`, `/cart/change.js`, `/cart.js`)
- CSS (no preprocessors, no Tailwind - just clean stylesheets)
- Google Tag Manager custom event integration
- GA4 enhanced e-commerce
- Microsoft Clarity custom events

## Compatibility

Tested on:

- Dawn theme (latest)
- Debut / Refresh themes
- Custom OS 2.0 themes

Should work on any Online Store 2.0 theme. Sections use standard Shopify section schema. JavaScript uses the documented Ajax API. If your theme supports sections and uses standard Shopify cart routes, these tools will work.

Not compatible with OS 1.0 themes or headless/Hydrogen builds.

## Browser support

- Chrome 80+
- Safari 14+
- Firefox 80+
- Edge 80+
- iOS Safari 14+
- Chrome for Android 80+
- Samsung Internet 14+

All JavaScript uses features supported by these browsers natively. No polyfills needed. The Intersection Observer API (used in sticky-atc and lazy-load) has full support across this matrix.

## Contributing

This repo is actively maintained and growing. If you work in Shopify CRO and have patterns that solve real conversion problems, contributions are welcome.

Before submitting:

1. Every Liquid section must include a complete `{% schema %}` block
2. Every JavaScript file must document its dependencies and expected DOM structure
3. No external dependencies - vanilla JS only
4. Mobile-first - test on a 375px viewport before submitting
5. Include a brief explanation of the conversion problem it solves

Open an issue first if you want to discuss a new pattern before building it.

## Roadmap

This repo will grow throughout 2026 as I ship more CRO experiments. Planned additions:

- [ ] Listicle page template with full 7-reason structure
- [ ] Cart drawer with integrated order bump and trust signals
- [ ] Subscription-first buy box with ritual framing
- [ ] ATF founder trust popup section
- [ ] PDP section reordering utility
- [ ] Landing page template for paid traffic
- [ ] Price reframe snippet (per-day, per-serving calculations)
- [ ] Announcement bar with dynamic offer targeting
- [ ] Post-purchase upsell page template
- [ ] Review highlight carousel (pulls highest-signal reviews)

## Who built this

I am Thomas Maghanga, a Shopify developer and CRO specialist based in Nairobi, Kenya. I have spent 4+ years building and optimizing storefronts for high-growth DTC brands, including subscription businesses in health, wellness and consumables.

I focus on the intersection of Shopify development, conversion rate optimization and retention. The work I do sits between the code and the business logic - translating growth goals into clean, testable technical execution.

- Portfolio: [maghanga-portfolio.vercel.app](https://maghanga-portfolio.vercel.app/)
- LinkedIn: [linkedin.com/in/thomas-maghanga](https://www.linkedin.com/in/thomas-maghanga/)

## License

MIT License. Use it, adapt it, ship it. Attribution appreciated but not required.
