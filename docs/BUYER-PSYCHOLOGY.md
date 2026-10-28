# From shopper questions to a testable improvement

This is a merchant learning tool, not an automatic store audit or an A/B testing service. FORM & FIELD, its product details, prices and feedback exercises are fictional. The proposed versions are hypotheses, not winners. No customer data is collected or transmitted.

The playbook uses plain language first: understand a problem, compare examples, decide what to change, gather evidence, then plan one test. Developer details are optional. Changing an example does not change a real storefront.

## Ideas and original sources

These are educational adaptations of ideas discussed by Rishi Rawat / Frictionless Commerce and Lorenzo Carreri. Neither is affiliated with or endorses this project. Their published examples and results are not evidence that this fictional coffee page will perform better.

| Merchant question | Source and adaptation | Evidence before publishing | Measure and watch |
| --- | --- | --- | --- |
| Why does this price make sense? | Rawat: [price justification](https://frictionless-commerce.com/blog/increase-conversions-with-price-justification/). Explain value and show transparent unit-use arithmetic rather than hiding the full price. | Actual product quantity, price, usage assumptions and verified value claims. | Purchase completion; watch misunderstanding of shipping, tax and recurring cost. |
| Why should I trust the maker's judgment? | Rawat: [demonstrate expertise](https://frictionless-commerce.com/blog/demonstrate-expertise/). Explain a decision, why it matters and how it would be checked. | Real process records, testing methods and supportable product claims. A sample roast decision is not a real roast log. | Purchase completion; watch comprehension, support questions and unsupported authority claims. |
| Can I find the answer that matters to me? | Rawat: [first-person interview with The Good](https://thegood.com/insights/rishi-rawat/), 39:16–39:52. Optional questions reveal relevant information and invite useful participation. | Real recurring shopper questions and usability feedback. | Purchase completion plus answer exploration as a diagnostic; watch hidden essentials and extra effort. |
| Is this claim too good to be true? | Rawat: [believable claims](https://frictionless-commerce.com/blog/too-good-to-be-true/). Replace absolute promises with specific, supportable descriptions and honest limits. | Documentation supporting every objective claim and the limits of that evidence. | Purchase completion; watch refunds, complaints and comprehension. |
| Is this the right choice for me? | Rawat: [us versus them](https://frictionless-commerce.com/blog/us-versus-them/). Explain meaningful differences and trade-offs, not invented competitor inferiority. | Verified comparison facts and customer reasons for choosing the product. | Purchase completion; watch mismatched expectations and returns. |
| What would using this look like? | Rawat: [nine shopper truths](https://frictionless-commerce.com/blog/the-9-truths-about-online-shoppers/), imagination. Make the use scenario concrete instead of relying on superlatives. | Real instructions, realistic use conditions and product limitations. | Purchase completion; watch unrealistic expectations and setup questions. |
| What are customers really telling me? | Carreri: [review mining](https://getmason.io/blog/post/how-to-increase-conversion-rate-and-sales-with-reviews-mining-2/). Tag recurring benefits, buying reasons, features and worries; turn a corroborated theme into one page change. | Actual reviews, support conversations, surveys or interviews. Competitor reviews are clues, not proof about your customers. | Purchase completion for the resulting change; watch overgeneralizing from a few vivid comments. |

The feedback exercise contains invented learning examples, not testimonials. A selected tag is a practice decision, not a finding about real customers. Gather a representative body of evidence and check context before acting. Interactions and clicks help diagnose use; they are not proof of revenue impact.

## Transparent price and routine examples

The coffee estimate uses the selected fictional price and bag weight with an explicitly selected grams-per-cup assumption. Only complete cups are counted; leftover grams are not silently treated as a full cup. The displayed per-cup amount is rounded upward to a cent. Shipping, tax, equipment, milk and waste are excluded. The full purchase price and subscription renewal terms remain visible.

The optional routine comparison lets the visitor choose cups per day and compare a bag size, then see how many days its complete cups could cover. It is arithmetic, not a freshness recommendation or a guarantee. “Use this bag size” applies only that size; it keeps the purchase type and delivery interval unchanged, never subscribes the visitor and never adds to the bag. The visitor can edit or reset the choices.

## A useful first test plan

1. Choose one shopper problem supported by evidence, not all lessons at once.
2. Write the specific page change and who should see it.
3. Verify every claim and all costs, terms, instructions and exclusions.
4. Choose a primary outcome, usually completed purchases per eligible visitor. Choose a downside to watch, such as returns, cancellations, margin or support questions.
5. Check the design on mobile and with keyboard-only navigation. Keep essential information available without extra interaction.
6. Before a live experiment, agree on assignment, consent, sample size, duration and analysis with someone qualified to implement it. Do not call an inconclusive result a win.

The in-browser plan stays in memory. It is not saved to a server or sent to an analyst. Reset and reload discard it. Original links are provided for further reading; clicking them leaves the lab.

## Validation boundary

See [TESTING-GUIDE.md](TESTING-GUIDE.md) for automated checks and manual review. Local events are explicitly marked `simulation: true` and `destination: "local-only"`; there is no analytics transport or measured conversion lift. New buyer-guidance features are in the Next.js educational app, not the separate Shopify Liquid section.
