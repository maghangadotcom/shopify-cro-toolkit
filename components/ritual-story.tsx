import { formatMoney } from "../lib/commerce";
import { FREQUENCIES, SHIPPING_CENTS, SHIPPING_THRESHOLD_CENTS, SUBSCRIPTION_DISCOUNT_PERCENT } from "../lib/fixtures";

/** Shopper-facing sample content. No customer proof, provenance or performance claims. */
export function RitualStory() {
  return (
    <div className="ritual-story">
      <p className="ritual-sample-label">FORM & FIELD · FICTIONAL COFFEE, ILLUSTRATED RITUAL</p>
      <section className="ritual-morning" aria-labelledby="ritual-title">
        <div className="ritual-story-heading">
          <p className="eyebrow">A LITTLE SPACE IN YOUR MORNING</p>
          <h2 id="ritual-title">Same familiar cup.<br /><em>Your own way to begin.</em></h2>
          <p>The sound of the grinder. Your favourite mug. A moment that belongs to you. Make Daybreak part of the routine you already enjoy.</p>
        </div>
        <ol className="ritual-steps">
          <li><span className="ritual-step-number">01 / MAKE IT YOURS</span><h3>Choose your cup.</h3><p>Reach for your usual brewer and a mug you love. Daybreak is whole bean, so have a grinder ready.</p></li>
          <li><span className="ritual-step-number">02 / FIND YOUR RHYTHM</span><h3>Grind. Brew. Adjust.</h3><p>Follow the recipe for your equipment. Adjust the next cup to your taste—there is no single recipe promised here.</p></li>
          <li><span className="ritual-step-number">03 / KEEP IT SIMPLE</span><h3>Plan the next morning.</h3><p>Buy a bag when you need one, or choose an optional delivery rhythm. One-time purchase is always available.</p></li>
        </ol>
      </section>

      <section className="ritual-fit" aria-labelledby="ritual-fit-title">
        <div className="ritual-profile-art" aria-hidden="true">
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="200" cy="247" rx="126" ry="18" fill="#d4c7b3" />
            <path d="M266 118h24c41 0 43 72 0 72h-21" stroke="#785b43" strokeWidth="14" />
            <path d="M103 105h174v83c0 46-38 59-87 59s-87-13-87-59v-83Z" fill="#eee2ca" stroke="#785b43" strokeWidth="3" />
            <ellipse cx="190" cy="105" rx="87" ry="25" fill="#fcf4e5" stroke="#785b43" strokeWidth="3" />
            <ellipse cx="190" cy="110" rx="73" ry="17" fill="#594330" />
            <path d="M164 72c-17-20 15-24 0-44M201 65c-16-20 15-24 0-44M234 73c-16-20 15-24 0-44" stroke="#a29179" strokeWidth="3" strokeLinecap="round" />
            <path d="M123 150c7 38 31 48 51 48" stroke="#fffaf1" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <span>A familiar ritual, illustrated.</span>
        </div>
        <div className="ritual-fit-copy">
          <p className="eyebrow">MEET YOUR MORNING BLEND</p>
          <h2 id="ritual-fit-title">A rounded cup.<br />A bright finish.</h2>
          <p className="ritual-tasting-label">Illustrative tasting notes</p>
          <ul className="ritual-tastes" aria-label="Fictional tasting notes"><li>Cocoa</li><li>Orange</li><li>Caramel</li></ul>
          <dl className="ritual-fit-facts">
            <div><dt>The coffee</dt><dd>Medium roast. Whole bean. This is a fictional blend and flavour description, not a tasting certification.</dd></div>
            <div><dt>Your setup</dt><dd>A grinder and your chosen brewer. Match the grind and recipe to your equipment; your results will vary.</dd></div>
            <div><dt>Your bag</dt><dd>Choose 250 g or 500 g to suit your use. Explore the cup calculator above rather than guessing how long a bag will last. The 1 kg option is sold out in this demo.</dd></div>
          </dl>
        </div>
      </section>

      <section className="ritual-process" aria-labelledby="ritual-process-title">
        <div><p className="eyebrow">BEHIND THE CUP · SAMPLE PROCESS</p><h2 id="ritual-process-title">Considered, not complicated.</h2><p>A glimpse of how a roast decision could be explained. These are illustrated steps, not claims about a real producer or batch.</p></div>
        <ol>
          <li><span aria-hidden="true">01</span><div><h3>Define the intended cup</h3><p>A rounded profile with a bright finish sets a direction for this fictional blend.</p></div></li>
          <li><span aria-hidden="true">02</span><div><h3>Compare sample brews</h3><p>A real producer would compare roast and brew choices, then record what changed.</p></div></li>
          <li><span aria-hidden="true">03</span><div><h3>Show the supporting record</h3><p>Actual roast logs and tasting notes would be needed to substantiate the process and flavour claims.</p></div></li>
        </ol>
      </section>

      <section className="ritual-subscription-story" aria-labelledby="ritual-subscription-title">
        <div><p className="eyebrow">YOUR RITUAL. YOUR RHYTHM.</p><h2 id="ritual-subscription-title">A fresh reason to look forward to morning.</h2><p>Prefer a regular delivery? The sample subscription saves {SUBSCRIPTION_DISCOUNT_PERCENT}% on coffee, with deliveries every {FREQUENCIES.join(", ")} weeks. Choose the interval that fits how much you actually brew—not the other way around.</p><p className="ritual-terms">Subscriptions renew until cancelled. This demonstration describes changing, pausing or cancelling before renewal; it has no account service and cannot carry out those actions. Buying once remains an equal choice.</p></div>
        <a className="ritual-return-link" href="#storefront">Choose your bag & rhythm <span aria-hidden="true">↑</span></a>
      </section>

      <section className="ritual-faq" aria-labelledby="ritual-faq-title">
        <div><p className="eyebrow">A FEW THINGS TO KNOW</p><h2 id="ritual-faq-title">Good mornings.<br />Clear answers.</h2><p>No hidden commitment. No surprise add-ons. Just a sample coffee page you can explore.</p></div>
        <div className="ritual-faq-list">
          <details><summary>Is this whole bean or ground coffee?</summary><p>Daybreak is whole bean in this fictional catalog. You need a grinder. No ground-coffee option is sold in this demo, and a measuring scoop does not replace a grinder or a scale.</p></details>
          <details><summary>Which size and delivery interval should I choose?</summary><p>Use your usual coffee dose and cups per day in the calculator above to compare sizes. Its estimates exclude brewing waste. Select a bag and, only if you want a subscription, an interval of {FREQUENCIES.join(", ")} weeks. The calculator does not promise a perfect delivery schedule.</p></details>
          <details><summary>What does delivery cost?</summary><p>Demo shipping is {formatMoney(SHIPPING_CENTS)} when the bag subtotal is below {formatMoney(SHIPPING_THRESHOLD_CENTS)}, and free at {formatMoney(SHIPPING_THRESHOLD_CENTS)} or more after discounts. Taxes are excluded. No real delivery timing or fulfilment is offered.</p></details>
          <details><summary>How does the sample subscription work?</summary><p>Coffee is {SUBSCRIPTION_DISCOUNT_PERCENT}% below the one-time fixture price, rounded per unit. The selected interval and recurring price appear before adding to your bag. A real subscription would renew until cancelled and would need a way to change, pause or cancel before renewal. Here, no subscription is created and future shipments are not charged or simulated.</p></details>
          <details><summary>Will extras be added automatically?</summary><p>No. A larger coffee bag or an optional measuring scoop needs your explicit choice. The scoop is a one-time item, never a recurring subscription item. Review and remove items in your demo bag before continuing.</p></details>
          <details><summary>Can I place an order or return a product?</summary><p>No. This is a fictional educational storefront with no checkout, payment, customer account or physical orders. There is no returns promise or policy to act on. A real merchant must provide verified delivery, cancellation and returns terms before selling.</p></details>
        </div>
      </section>
    </div>
  );
}
