# Run the lab and install the Shopify section

The Next.js lab is a fictional storefront simulation. It runs on localhost or Vercel, uses deterministic fixtures, and never sends a Shopify cart request. It has no checkout, payments, analytics transmission, database, or credentials. Its fixed USD discount and shipping rules are demo fixtures, not merchant business rules.

The files in `liquid-sections/subscription-hero/` are a separate Shopify Online Store 2.0 theme integration. They read real product variants and selling plan allocations from Liquid and progressively enhance a native product form. They do not import the lab fixtures.

## Shopify development theme

Use a duplicate, unpublished theme in a development store. This section has not been deployed or tested against a Shopify store as part of this repository build. No Dawn, third-party subscription app, or production compatibility claim is made.

1. Copy `liquid-sections/subscription-hero/subscription-hero.liquid` into the theme's `sections/subscription-hero.liquid`.
2. Copy `subscription-hero.js` and `subscription-hero.css` from the same folder into the theme's `assets/` directory, retaining their names.
3. Add **CRO purchase options** in the Theme Editor. Leave Product empty on a product template to use the current product, or select a product explicitly. Set real subscription and cancellation terms before any public use.
4. Use products with representative variants, inventory policies, and selling plans already configured through your store's subscription setup. The section does not create selling plans or subscription contracts.
5. Confirm that each variant exposes the intended `selling_plan_allocations`. Delivery labels, allocation price, per-delivery price, and charge due at checkout come from Shopify. One-time purchase is omitted when a variant requires a selling plan.
6. Test in the development theme before considering any production publication.

Without JavaScript, variant links load the product variant URL; the native form submits its variant ID, quantity, and selected selling plan. The plan option label includes its price and checkout charge. With JavaScript, variant options and prices update in place. The optional Ajax request uses Shopify's locale-aware `window.Shopify.routes.root + 'cart/add.js'`. It intercepts this section's form only.

Successful Ajax additions expose a bubbling `cro:cart-added` event with the returned item in `event.detail.item`. This is an integration hook, not an automatic connection to a theme's cart drawer. **View cart** points to the Shopify cart. If your theme globally intercepts product forms, resolve the ownership of this form's submit handling before enabling Ajax; do not allow two handlers to add the same item.

The pending state locks purchase controls and duplicate submissions. A failed or aborted POST is never retried automatically because Shopify may already have processed it. Customers are directed to check their cart first. Inventory and final cart prices remain Shopify's responsibility.

## Required manual verification in a development store

- Test one-time purchase, every available selling plan, and a subscription-only variant; inspect the cart's variant, quantity, selling plan, checkout charge, and future terms.
- Change variants whose plan allocations differ. Confirm an incompatible plan is cleared and the correct price appears. Include a variant with no plans and an unavailable variant.
- Disable JavaScript and complete variant navigation plus a native form addition.
- Submit rapidly; simulate a slow response, a stock rejection, and a network interruption. Check actual cart state before retrying an uncertain request.
- Test keyboard focus and screen-reader labels/status at 320px, 390px, 768px, and 1440px. Check Theme Editor section reload/removal and multiple instances.
- Check locale-prefixed routes and presentment currencies, including a zero-decimal currency. Prices are formatted server-side with Shopify money filters; no USD formatter is used in this integration.
- Verify your theme's cart renders `line_item.selling_plan_allocation` and checkout charge correctly. Verify shipping, tax inclusion, discounts, cancellation disclosure, consent, and your subscription application's required terms. This section does not calculate shipping/taxes or replace checkout.

## Platform boundaries

Shopify's Ajax API is a Shopify-hosted theme API; it is not a general endpoint to call from the Vercel lab. A real headless integration would require a separately scoped Storefront API implementation. This repository does not implement Shopify Functions, checkout extensibility, app billing, or a live headless cart.

References: [Shopify subscription theme integration](https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/add-subscriptions-to-your-theme), [selling plan allocations](https://shopify.dev/docs/api/liquid/objects/selling_plan_allocation), [Ajax Cart API](https://shopify.dev/docs/api/ajax/reference/cart).
