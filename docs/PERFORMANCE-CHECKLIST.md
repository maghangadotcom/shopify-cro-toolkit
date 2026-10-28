# Performance verification

Observed local production measurements are recorded in [PERFORMANCE-RESULTS.md](PERFORMANCE-RESULTS.md). No field Core Web Vitals, conversion impact or performance improvement is claimed. The lab uses local SVG artwork with reserved dimensions, system fonts, a static Next.js route and no analytics SDK. Those choices should still be measured.

1. Build and start a production server (`npm run build`, then `npm start`). Do not measure the development server.
2. Record the exact commit, Node/browser/Lighthouse versions, route, device preset, throttling, test location, cache state and date.
3. Run at least three cold-cache Lighthouse navigation measurements with the same configuration. Report individual runs and median LCP/CLS/TBT, along with the generated reports. Lab results are not real-user INP or field Core Web Vitals.
4. Profile add-to-cart, quantity changes and opening the drawer under CPU throttling. Check layout shifts, main-thread tasks and bundle/network costs.
5. Repeat on a real mobile device. Compare changes against the same baseline setup; separate product functionality from performance tradeoffs.
6. A Shopify theme requires its own dev-store measurement: apps, consent tools, themes, assets and checkout integrations can change performance materially.

The original `performance/` files are placeholders and are not used by this app. Do not install them or cite them as verified optimizations.
