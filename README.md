# Shopify CRO Lab

A merchant-friendly learning lab by [Thomas Maghanga](https://maghanga.com): understand a shopper problem, try a clearer product-page example, and prepare an evidence-led test. No coding or conversion-rate jargon is needed to start.

The guided playbook adapts ideas discussed by **Rishi Rawat / Frictionless Commerce** and **Lorenzo Carreri**. It is educational, not affiliated with or endorsed by either. [Concepts, original sources and evidence requirements](docs/BUYER-PSYCHOLOGY.md).

**Status:** an implemented demo for review on `development`. FORM & FIELD, Daybreak coffee, inventory and prices are fictional fixtures. There is no checkout, payment collection, customer data, analytics transmission or measured conversion lift. This repository does not establish Shopify Plus certification or a live-store integration.

## Start as a merchant

1. **Start here:** understand the fictional coffee example and its limits.
2. **Explore improvements:** compare a weak example with a proposed improvement. Each lesson explains the shopper problem, what to change, evidence to gather, what to measure and what could go wrong.
3. **Make a test plan:** choose one improvement and check the evidence you still need. The plan is a local draft, not a live experiment or a promise of better sales.
4. **Try the coffee page:** change bag size, inspect the cost-per-cup assumptions and optionally apply a bag size after comparing a routine. Nothing is ordered and no subscription is created.

Developer evidence, simulated event payloads and failure controls are in the optional **Developer details** disclosure. Reset clears the new learning choices as well as the cart and event history. Reload also discards the in-memory learning plan.

## Run the lab

Use Node.js 24 LTS (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Open the printed local URL, normally `http://127.0.0.1:3000`. No credentials or environment variables are required.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Browser checks use Google Chrome locally. In CI, set `PLAYWRIGHT_CHANNEL=chromium` and install Chromium with `npx playwright install --with-deps chromium` first. The test server runs on port 3100. See [the testing guide](docs/TESTING-GUIDE.md) for the exact flows and limits.

## What works

| Feature                   | Try                                                                                                    | Why / implementation                                                                                                                                                    | Evidence                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merchant playbook | Compare examples, explore shopper questions, classify fictional feedback and prepare a test plan | Plain-language actions, original source attribution and evidence requirements; no claimed results | [Playbook](components/merchant-playbook.tsx), [concept guide](docs/BUYER-PSYCHOLOGY.md) |
| Subscription product page | Choose 250 g or 500 g, select one-time or subscription, change delivery interval; 1 kg is sold out     | Visible price and renewal terms, explicit one-time default, integer-cent rounding, shared inventory across plans                                                        | [UI](components/cro-lab.tsx), [pricing and inventory](lib/commerce.ts), [unit tests](tests/commerce.test.ts)                                                     |
| Cart drawer               | Add coffee, change quantity, reach $60, add or dismiss the optional scoop                              | Atomic state updates, request lock, recoverable simulated failures, transparent shipping/totals, recurring lines kept separate, native dialog with keyboard containment | [Cart logic](lib/commerce.ts), [browser tests](tests/browser.spec.ts)                                                                                            |
| Experiment inspector      | Switch baseline/proposed designs; inspect local event payloads; simulate latency or one failure; reset | Both designs share prices and state. Events carry explicit simulation labels and sequences. Hypotheses include primary metrics and guardrails                           | [Event contract](lib/events.ts), [event tests](tests/events.test.ts), [validation plan](docs/TESTING-GUIDE.md)                                                   |
| Shopify theme source      | Install the separate section in an unpublished development theme                                       | Actual Liquid variants and selling-plan allocations, section schema, native product form fallback, scoped progressive JavaScript                                        | [Section source](liquid-sections/subscription-hero/subscription-hero.liquid), [installation](docs/INSTALLATION.md), [schema guide](docs/SECTION-SCHEMA-GUIDE.md) |

Merchant lessons lead with practical guidance; engineering evidence remains available separately. Subscription prices are 15% below fixture prices, rounded once per unit. Demo shipping is $5 below $60 and free at $60 after discounts; no tax is calculated. Future subscription shipments are not charged or simulated.

## Two runtimes, an explicit boundary

The Next.js app is a **browser-local simulation**, suitable for Vercel. The cart lives in memory and resets on reload. Only an upsell dismissal persists in `sessionStorage` for the browser tab; Reset clears it. At most 30 local event records are retained. There is no database, authentication, analytics SDK or external request from cart actions.

The **separate OS 2.0 section** runs in a Shopify-hosted theme and uses Shopify's real product/selling-plan data and locale-aware Ajax cart route. It does not run on Vercel. Source lint and schema validation do not establish development-store compatibility; actual store testing is still required. See [Shopify's Ajax API](https://shopify.dev/docs/api/ajax) and [selling plan allocations](https://shopify.dev/docs/api/liquid/objects/selling_plan_allocation).

## Architecture

```text
app/                           Next.js shell, styles and metadata
components/cro-lab.tsx          Product flow, cart dialog and optional inspector
components/merchant-playbook.tsx Merchant lessons and local test-plan builder
lib/playbook.ts                Source-grounded lesson content
lib/buyer-guidance.ts          Explicit cup estimates and routine comparisons
lib/fixtures.ts                Deterministic fictional catalog
lib/commerce.ts                Framework-independent pricing, cart and stock rules
lib/events.ts                  Validated local event records; no transport
tests/                         Node unit tests and Playwright browser flows
liquid-sections/subscription-hero/  Separate Shopify section, JS and CSS
docs/                          Integration and validation guidance
.github/workflows/ci.yml        Read-only lint, typecheck, unit, build and browser CI
```

## Hosting on Vercel

The app builds as a static Next.js route using standard `npm run build`. No API secrets, database or commerce services are needed. Import this repository with the Next.js preset, repository root as Root Directory, Node.js 24 and npm's lockfile. Verify the production branch before linking any Git deployment; `development` should produce a preview only. Do not promote it to production until reviewed.

The existing personal educational showcase is at [shopify-cro-lab.vercel.app](https://shopify-cro-lab.vercel.app/). Changes on `development` remain review work; a draft PR does not authorize merging or promoting a preview to production. This addition does not create paid services or a Shopify store.

Three local production Lighthouse runs and their configuration are recorded in [the performance report](docs/PERFORMANCE-RESULTS.md). These are lab measurements, not field metrics or conversion results.

## What remains scaffolded

The original repository contained one-line placeholders and a README describing future capabilities as implemented. Those claims have been replaced here. The original `js-utils/`, `analytics/`, `performance/`, `snippets/` files and other `liquid-sections/` folders remain **unimplemented scaffolds**, except the subscription section explicitly listed above. They are not imported by the lab and should not be installed as working utilities.

Roadmap: verify the section in a Shopify development store; add live integration tests against a dev theme; repeat performance measurements on a deployed preview; validate analytics consent and assignment in a real experiment; implement additional sections only with their own evidence. There are no claimed conversion improvements, client results or cross-theme guarantees.

## About

Thomas Maghanga — Shopify frontend and CRO implementation. This lab makes product decisions, engineering constraints and verification inspectable.

[Portfolio](https://maghanga.com) · [LinkedIn](https://www.linkedin.com/in/thomas-maghanga/)

