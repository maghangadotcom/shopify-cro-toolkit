# Local production performance measurements

Three cold mobile Lighthouse navigation runs on 28 October 2026 produced a median performance score of **100**, LCP **1.899 seconds**, CLS **0**, and TBT **31 milliseconds**. These are local lab measurements of the CRO Lab's initial page load, not field Core Web Vitals, real-user INP, Shopify theme measurements, or conversion results.

## Measured build

- Route: `http://127.0.0.1:3101/`, HTTP 200, production `next start`; no deployment.
- Source: the application implementation recorded in [ecdaf439](https://github.com/maghangadotcom/shopify-cro-toolkit/commit/ecdaf439ab03be85416e63e61f73118033fd5211). Measurements ran before the prepared commits were pushed. Build identity and hashes below identify the measured output; later source-link and build-check changes are outside this baseline.
- Next.js: 16.4.3; React: 19.3.1; Node.js: 26.12.1; npm: 11.20.0.
- Lighthouse: 13.6.0, fetched transiently from the official npm registry; no project dependency added.
- Google Chrome: 156.0.8078.48; headless; macOS 26.2, arm64.
- Next.js build ID: `X8sNarSbp4bEwfe2QHNQf`.

SHA-256 identities, unchanged between the start and end of measurement:

| File | SHA-256 |
| --- | --- |
| `.next/BUILD_ID` | `8f77962d12d857bc8d2b713a12212acaff4fa726a3019fffbcfe41c4dc26ec10` |
| `.next/server/app/index.html` | `474b78f3383332f9a75ee7e074b09c69f58d3e41fdd17fb21bd02475101b01e5` |
| `.next/server/app/page.js` | `c05e7930c732f7b436a4a5caa7cc6e8fc6e6d20438b635e72fe5dc5e1edd69d8` |
| `app/page.tsx` | `9e8d8361cb5f035f2453e58f7a7e22915931bbe9772526b3ba6c122b291e7567` |
| `app/globals.css` | `77327dd2274dd133d9d00f19b62dbea0aa59bcbc9ea7d3d4979288fb6fe50b4d` |
| `package-lock.json` | `4de192b3b0e6ff72c25366a9b0a21d9fb6e36142a5ec3b3d3011c6b8bd1e0e8e` |

## Configuration and results

Each CLI invocation launched a fresh isolated Chrome profile, with Lighthouse storage reset enabled. Runs were sequential against the same production build. The server and operating-system caches were already warm; the browser profile and browser cache were cold.

Lighthouse's default mobile emulation used a Moto G Power user agent, a 412 × 823 viewport, and device pixel ratio 1.75. Throttling used the simulated (Lantern) method: 150 ms RTT, 1,638.4 Kbps throughput, and 4× CPU slowdown. The recorded config also lists 562.5 ms request latency, 1,474.56 Kbps download, and 675 Kbps upload for its DevTools throttling parameters. These are simulation settings, not a physical phone or actual mobile network.

| Run | Navigation start (UTC) | Performance / 100 | LCP (ms) | CLS | TBT (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | 2026-10-28 13:20:15.553 | 100 | 1,899.21 | 0 | 31 |
| 2 | 2026-10-28 13:20:44.505 | 100 | 1,888.99 | 0 | 40.5 |
| 3 | 2026-10-28 13:21:05.270 | 99 | 1,961.70 | 0 | 7.5 |
| **Median** | | **100** | **1,899.21** | **0** | **31** |

All three reports completed without Lighthouse runtime errors or run warnings.

## Reproduce

Install the locked project dependencies, build once, and start the production server in one terminal:

```sh
npm ci
npm run build
npm start -- --port 3101
```

In another terminal, run the following command three times, changing the report suffix from `1` to `2` and then `3`. Keep other applications and machine load as consistent as possible. Use the appropriate installed Chrome executable for your operating system.

```sh
mkdir -p test-results/performance
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npm exec --yes --package=lighthouse@13.6.0 -- lighthouse \
  http://127.0.0.1:3101/ \
  --only-categories=performance \
  --form-factor=mobile \
  --throttling-method=simulate \
  --chrome-flags='--headless --disable-gpu' \
  --output=json --output=html \
  --output-path=./test-results/performance/mobile-1 \
  --quiet
```

The compact [performance-summary.json](performance-summary.json) is versioned for review. Raw JSON, HTML reports, and the original `summary.json` are retained locally in the ignored `test-results/performance/` directory. They are generated evidence and are not committed. SHA-256 hashes of this run's JSON reports:

- Run 1: `fa9f248754aa6bb82c312418eecbc947222f35d3a8ca6fcf405224ffa8b369e4`
- Run 2: `8e1a7a0d7e6e1ef91275ffce444ba313247cc48cf3edc7651b5cb8a042d70cfc`
- Run 3: `2deda3005135da4d298a94e3f21b00fdd8a48c0b2dfeee9e96c825723a670c65`

## Limits and follow-up

The loopback server excludes public-network latency, TLS, Vercel edge behavior, and real visitor devices. Shared host load can affect the scores, and three runs are a small sample. The initial page-load audit does not measure subsequent drawer or add-to-cart interactions, keyboard usability, or assistive-technology support. TBT is a lab diagnostic and must not be presented as INP.

There is no before/after baseline, performance improvement claim, or conversion-lift claim. Repeat this protocol on the deployed preview, profile cart interactions under CPU throttling, and test on a real mobile device. A Shopify development store needs separate measurements with its actual theme, apps, product data, consent tools, and subscription integration.
