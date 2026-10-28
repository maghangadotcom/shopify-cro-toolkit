# Validation and experiment plan

This lab has deterministic fixtures, not live customers or measured conversion results. The baseline/proposed toggle is an inspection tool, not random assignment or a production A/B testing service.

## Automated checks

Use Node 24 and `npm ci`, then:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

The node:test suite covers per-unit half-up currency rounding, exact USD formatting, empty carts, $59.99/$60/$60.01 shipping thresholds, stock shared across plans, immutable cart changes, invalid quantities, overflow and local event records. It uses no test framework dependency.

Playwright runs Chrome at 320, 390, 768 and 1440 pixels. It checks product choices, subscription frequency and prices, stock, baseline parity, cart changes, shipping, optional upsell dismissal and reset, failed-request recovery, rapid clicks under latency, keyboard dialog use, mobile sticky action, reduced motion, horizontal overflow and console errors. Test source is the authoritative list of assertions. Browser coverage is Chromium only; Safari/VoiceOver, Firefox and a real touch device still need manual verification.

For portable Chromium (including CI):

```sh
npx playwright install --with-deps chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:browser
```

If a compatible local Chromium is already installed, use its explicit path without changing the CI default:

```sh
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

## Merchant and buyer-guidance review

1. Start from a fresh reload. **Developer details** should be closed; the plain-language learning path should work without opening it.
2. Navigate the lessons using only the keyboard. Compare before/proposed examples and confirm each explains a problem, an action, evidence needed, a metric and a possible downside.
3. Explore a shopper question and tag fictional feedback. Confirm that these actions reveal relevant content, not testimonials or invented customer findings. Nothing should be gated behind submitting personal information.
4. Choose one lesson for a test plan and change its evidence checklist. Verify the plan remains a draft, does not claim a winning test and is discarded on reset or reload.
5. On the proposed coffee page, use the default 250 g / $24 / 18 g-per-cup assumptions: 13 complete cups, 16 g left over, $1.85 per cup rounded up. Select 15 g: 16 complete cups and $1.50 per cup. Verify shipping, tax and other exclusions remain clear.
6. Change size and purchase type. The cup estimate should use the displayed price. Toggle baseline/proposed: the full price and choices should be preserved, even when optional guidance is hidden.
7. Compare 500 g at two cups per day, then explicitly apply **Use this bag size**. Only size should change: no subscription, frequency change or cart addition. All purchase controls remain available without using this comparison.
8. Reset. Confirm default size, one-time purchase, dose, routine comparison, learning choices and event history are restored. Test repeated exploration/application, then reset again.
9. Open **Developer details** to inspect new local events. Confirm deterministic sequence numbers, explicit simulation/local-only labels and no network transmission. Diagnostic clicks are not conversion outcomes.

These are required review scenarios, not a claim that every platform has been manually verified. Automated assertions are in `tests/browser.spec.ts` and `tests/buyer-guidance.test.ts`. Source attribution and evidence limits are in [BUYER-PSYCHOLOGY.md](BUYER-PSYCHOLOGY.md).

## Existing commerce walkthrough

Open **Developer details** when using the engineering controls below.

1. Start with one-time 250 g: $24 plus $5 demo shipping. Switch to subscription: $20.40 and an explicit renewal interval.
2. Choose 500 g; then choose sold-out 1 kg and verify purchase is disabled. Change back.
3. Add different plans for the same size. They remain separate lines but share inventory. Exhausting stock prevents another addition.
4. Add one-time 250 g then 500 g to cross the $60 threshold. Remove a line and verify shipping is recalculated.
5. Add the $8 scoop once. It is never a recurring line. Dismiss it and reload: the dismissal persists in this tab. Reset restores the offer and empty cart.
6. Enable latency. Rapidly click Add and quantity controls; only one pending mutation is accepted. Other controls show busy state.
7. Fail the next request. The cart remains unchanged; the error is visible. Retry normally. Closing the cart during an update should not force it open again.
8. Use only the keyboard. Verify visible focus, dialog containment, Escape and focus return, radio/select use and mobile sticky action. Test 200% zoom and reduced motion.
9. Inspect each local event's sequence and simulation/destination fields. No cart action should transmit data to another service. At most 30 events remain in memory.

## Shopify verification boundary

The standalone Liquid section has source/schema checks, but requires an unpublished development theme to establish runtime behaviour. Follow [INSTALLATION.md](INSTALLATION.md). Verify one-time-only products, products requiring a selling plan, multiple selling plans, sold-out variants, price adjustments, localization, no-JS forms and failed/uncertain Ajax responses. Do not claim Recharge, Skio or any theme compatibility without testing it.

## Before a real controlled experiment

Define the eligible audience and exposure event; choose a single primary metric, minimum detectable effect, power, sample size and fixed analysis plan before launch. Assign visitors consistently and check sample-ratio mismatch. Instrument only with appropriate consent; de-duplicate events using a contract that matches the actual platform and checkout. Validate attribution and server-side order reconciliation.

The lab proposes hypotheses for shopper understanding, purchase completion, subscription selection and cart completion. The learning examples and the local test-plan checklist are not a randomized experiment. Validate purchase conversion, attach rate and AOV alongside margin, refunds, early subscription cancellation, support contacts, cart errors and accessibility. Do not optimize subscription attach rate while obscuring renewal terms. Monitor guardrails; do not stop early merely because a result looks positive. Record inconclusive outcomes as such. There are no effect sizes or experiment results in this repository.

