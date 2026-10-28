# Purchase-options section schema

`liquid-sections/subscription-hero/subscription-hero.liquid` contains the implemented schema and preset. Its editor name is **CRO purchase options**. The older empty section folders remain roadmap items.

| Setting       | Type       | Purpose                                                                          |
| ------------- | ---------- | -------------------------------------------------------------------------------- |
| `product`     | `product`  | Optional featured product; defaults to the current product on product templates. |
| `eyebrow`     | `text`     | Short, escaped introductory label.                                               |
| `description` | `richtext` | Merchant-controlled introduction.                                                |
| `terms_url`   | `url`      | Merchant's actual subscription and cancellation policy.                          |

The preset allows merchants to add this section through the Online Store 2.0 Theme Editor. Each section instance uses `section.id` for its form, heading, quantity, and purchase-selector IDs. The JS initializes newly loaded Theme Editor sections and cleans up per-instance listeners when removed.

Product variants and selling plans are deliberately absent from editor settings. Shopify's product and `variant.selling_plan_allocations` objects provide valid purchasable IDs, availability, prices, names, checkout charges, and per-delivery prices. Do not hard-code a percentage discount or substitute a made-up plan ID in a theme section. The Vercel demo's fixed fixtures are a different runtime.

Schema JSON parsing and JavaScript syntax checks verify source structure only. Run Shopify Theme Check in a development theme and complete the [installation checks](INSTALLATION.md) before describing this section as Shopify-tested. JSON validity does not verify Liquid rendering, theme integration, inventory behavior, subscription contracts, or checkout accuracy.

Reference: [Shopify section schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema).
