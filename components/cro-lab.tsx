"use client";

import Image from "next/image";
import { RitualStory } from "./ritual-story";
import { MerchantPlaybook } from "./merchant-playbook";
import { BAG_GRAMS, cupEstimate } from "../lib/buyer-guidance";
import { useEffect, useRef, useState } from "react";
import {
  addLine,
  cartTotals,
  formatMoney,
  selectionToLine,
  setLineQuantity,
  unitPrice,
} from "../lib/commerce";
import type {
  CartLine,
  Frequency,
  PurchaseType,
  Selection,
} from "../lib/commerce";
import { VARIANTS, UPSELL, SHIPPING_THRESHOLD_CENTS } from "../lib/fixtures";
import { createEvent } from "../lib/events";
import type { EventName } from "../lib/events";

const REPO =
  "https://github.com/maghangadotcom/shopify-cro-toolkit/blob/development/";
const DISMISS_KEY = "cro-lab:scoop-dismissed:v1";
type LabEvent = ReturnType<typeof createEvent>;
const initialEvent = createEvent(
  "view_item",
  { item_id: "daybreak", experiment: "proposed" },
  1,
);

export function CroLab() {
  const [view, setView] = useState<"guide" | "shop">("guide");
  const [resetGeneration, setResetGeneration] = useState(0);
  const [dose, setDose] = useState(18);
  const [cupsPerDay, setCupsPerDay] = useState(1);
  const [previewBag, setPreviewBag] = useState(VARIANTS[0].id);
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [variantId, setVariantId] = useState(VARIANTS[0].id);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");
  const [frequency, setFrequency] = useState<Frequency>(4);
  const [cart, setCart] = useState<CartLine[]>([]);
  const cartRef = useRef<CartLine[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([initialEvent]);
  const sequence = useRef(1);
  const [experiment, setExperiment] = useState<"baseline" | "proposed">(
    "proposed",
  );
  const [latency, setLatency] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const buyBox = useRef<HTMLDivElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const variant = VARIANTS.find((item) => item.id === variantId)!;
  const price = unitPrice(variant.priceCents, purchaseType);
  const totals = cartTotals(cart);
  const hasScoop = cart.some((line) => line.variantId === UPSELL.id);
  const largerBag = VARIANTS[1];
  const largerStock = largerBag.stock - cart.filter((line) => line.variantId === largerBag.id).reduce((sum, line) => sum + line.quantity, 0);
  const selection: Selection = {
    variantId,
    purchaseType,
    frequency,
    quantity: 1,
  };
  const isProposed = experiment === "proposed";
  const cup = cupEstimate(price, BAG_GRAMS[variantId], dose);
  const routineVariant = VARIANTS.find((item) => item.id === previewBag)!;
  const routineCups = cupEstimate(unitPrice(routineVariant.priceCents, purchaseType), BAG_GRAMS[previewBag], dose);

  function track(
    name: EventName,
    payload: Record<string, string | number | boolean> = {},
  ) {
    const event = createEvent(
      name,
      { experiment, ...payload },
      ++sequence.current,
    );
    setEvents((previous) => [event, ...previous].slice(0, 30));
  }

  useEffect(() => {
    try {
      // Restore a visitor's explicit dismissal after hydration; storage may be unavailable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
    } catch {
      /* The demo still works without browser storage. */
    }
    const observer = new IntersectionObserver(
      ([entry]) =>
        setStickyVisible(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        ),
      { threshold: 0 },
    );
    if (buyBox.current) observer.observe(buyBox.current);
    return () => observer.disconnect();
  }, []);

  function showView(nextView: "guide" | "shop") {
    setView(nextView);
    track("experience_viewed", { view: nextView });
    requestAnimationFrame(() => document.getElementById(nextView === "guide" ? "start-here" : "storefront")?.scrollIntoView({ behavior: "instant" }));
  }

  function addScoop() {
    void mutate("add", (lines) => addLine(lines, selectionToLine({
      variantId: UPSELL.id, purchaseType: "one-time", quantity: 1,
    })));
  }

  function openCart() {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setError("");
    dialog.current?.showModal();
  }

  async function mutate(
    operation: string,
    transform: (lines: CartLine[]) => CartLine[],
  ) {
    if (lock.current) return;
    lock.current = true;
    const shouldOpen = !dialog.current?.open;
    if (shouldOpen)
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : addButton.current;
    setBusy(true);
    setError("");
    const shouldFail = failNext;
    if (shouldFail) setFailNext(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, latency ? 1200 : 180));
      if (shouldFail)
        throw new Error(
          "Simulated request failed. Your cart is unchanged. Try again.",
        );
      const next = transform(cartRef.current);
      cartRef.current = next;
      setCart(next);
      track(operation === "add" ? "add_to_cart" : "cart_updated", {
        operation,
        item_count: cartTotals(next).itemCount,
        value_cents: cartTotals(next).subtotalCents,
      });
      setNotice(
        operation === "add" ? "Added to your demo bag." : "Demo bag updated.",
      );
      if (shouldOpen) dialog.current?.showModal();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update the demo bag. Try again.",
      );
      track("request_failed", { operation });
      if (shouldOpen) dialog.current?.showModal();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function addProduct() {
    void mutate("add", (lines) => addLine(lines, selectionToLine(selection)));
  }

  function dismissUpsell() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      /* Optional persistence. */
    }
    track("upsell_dismissed", { item_id: UPSELL.id });
  }

  function reset() {
    if (lock.current) return;
    dialog.current?.close();
    cartRef.current = [];
    setCart([]);
    setVariantId(VARIANTS[0].id);
    setPurchaseType("one-time");
    setFrequency(4);
    setDose(18);
    setCupsPerDay(1);
    setPreviewBag(VARIANTS[0].id);
    setGuidanceOpen(false);
    setPriceDetailsOpen(false);
    setResetGeneration((value) => value + 1);
    setLatency(false);
    setFailNext(false);
    setError("");
    setDismissed(false);
    setExperiment("proposed");
    sequence.current = 1;
    setEvents([createEvent("demo_reset", { experiment: "proposed" }, 1)]);
    try {
      sessionStorage.removeItem(DISMISS_KEY);
    } catch {
      /* Optional persistence. */
    }
    setNotice("Demo reset. Your bag, choices and event log are clear.");
  }

  const remainingStock = Math.max(
    0,
    variant.stock -
      cart
        .filter((line) => line.variantId === variant.id)
        .reduce((sum, line) => sum + line.quantity, 0),
  );

  return (
    <>
      <a className="skip-link" href={view === "guide" ? "#start-here" : "#storefront"}>
        Skip to content
      </a>
      <div className="lab-banner">
        <span className="live-dot" /> A practical guide for store owners{" "}
        <span className="banner-detail">
          Fictional brand · Simulated commerce · No checkout
        </span>
      </div>
      <header className="lab-header">
        <a className="lab-logo" href="#">
          cro<span>lab</span>
          <span className="logo-slash">/</span>
        </a>
        <div className="author">
          Built by{" "}
          <a href="https://maghanga.com" target="_blank" rel="noreferrer">
            Thomas Maghanga ↗
          </a>
          <small>Clearer shopping experiences, one improvement at a time</small>
        </div>
        <nav aria-label="Lab">
          <a href="#start-here" onClick={() => setView("guide")}>Start here</a>
          <a href="#improvements" onClick={() => setView("guide")}>Explore improvements</a>
          <a href="#test-plan" onClick={() => setView("guide")}>Make a test plan</a>
        </nav>
      </header>

      <main>
        <div className="experience-switcher">
          <div role="group" aria-label="Choose your experience">
            <button aria-pressed={view === "guide"} onClick={() => showView("guide")}>Merchant guide</button>
            <button aria-pressed={view === "shop"} onClick={() => showView("shop")}>Shopper preview</button>
          </div>
          <button className="text-button" disabled={busy} onClick={reset}>↻ Reset demo</button>
        </div>
        <div hidden={view !== "guide"}>
        <section className="intro" id="start-here" aria-labelledby="lab-title">
          <div>
            <p className="eyebrow">A HANDS-ON GUIDE FOR MERCHANTS</p>
            <h1 id="lab-title">Help shoppers<br /><em>choose with confidence.</em></h1>
          </div>
          <div className="intro-copy">
            <p>Not sure what to improve on your product page?</p>
            <p>Start with a shopper’s question. Try a clearer example. Leave with one change to investigate—no coding or marketing jargon needed.</p>
            <a href="#improvements">Choose a shopper problem <span>↓</span></a>
            <p className="guide-disclaimer">Practice on fictional coffee. These are ideas to test, not promises of more sales.</p>
          </div>
        </section>

        <MerchantPlaybook key={resetGeneration} onPreview={() => showView("shop")} onTrack={(action, payload) => track("guide_interaction", { action, ...payload })} />

        </div>
        <div hidden={view !== "shop"}>
        <section className="storefront-intro" aria-labelledby="try-store-title">
          <p className="eyebrow">TRY IT AS A SHOPPER</p>
          <h2 id="try-store-title">A moment worth making time for.</h2>
          <p>A fictional coffee shop to explore. No checkout, payment or real subscription.</p>
        </section>

        <section
          className="experiment-toolbar"
          aria-label="Experiment controls"
        >
          <div>
            <span className="eyebrow">YOU’RE VIEWING</span>
            <div className="segmented" role="group" aria-label="Design variant">
              {(["baseline", "proposed"] as const).map((mode) => (
                <button
                  key={mode}
                  aria-pressed={experiment === mode}
                  onClick={() => {
                    setExperiment(mode);
                    track("experiment_viewed", {
                      design: mode,
                      experiment: mode,
                    });
                  }}
                >
                  {mode === "baseline" ? "Baseline" : "Proposed design"}
                  {mode === "proposed" && <span> B</span>}
                </button>
              ))}
            </div>
          </div>
          <p>
            {isProposed
              ? "B / Clear value, visible terms, contextual cart."
              : "A / Same product and prices, with a simpler buy box."}
            <span>Two examples, not a live test. Neither has proven better.</span>
          </p>

        </section>

        <section
          id="storefront"
          className={`storefront ${isProposed ? "" : "baseline"}`}
          aria-label="Fictional storefront demo"
        >
          <div className="store-header">
            <span className="store-brand">
              FORM <i>&</i> FIELD<span>COFFEE, WITH INTENTION.</span>
            </span>
            <button className="bag-button" onClick={openCart}>
              Your bag <span>{totals.itemCount}</span>
            </button>
          </div>
          <div className="product-grid">
            <div className="product-visual">
              <div className="image-label">
                <span>THE EVERYDAY COLLECTION</span>
                <span>01 / 01</span>
              </div>
              <Image
                src="/daybreak.svg"
                alt="Illustration of the fictional Form and Field Daybreak coffee bag"
                width={800}
                height={900}
                priority
                unoptimized
              />
              <span className="image-caption">
                Original demo artwork. Fictional product.
              </span>
              <div className="roast-note">
                <span>ROAST PROFILE</span>
                <strong>Balanced. Bright. Beautifully everyday.</strong>
                <div className="roast-scale">
                  <span>LIGHT</span>
                  <i />
                  <i />
                  <i className="active" />
                  <i />
                  <i />
                  <span>DARK</span>
                </div>
              </div>
            </div>
            <div className="buy-box" ref={buyBox}>
              <p className="eyebrow">WHOLE BEAN / MEDIUM ROAST</p>
              <div className="title-row">
                <h1>Daybreak blend</h1>
                <span className="product-mark" aria-hidden="true">
                  ↗
                </span>
              </div>
              <p className="product-description">
                A small pause before the day begins. Grind, brew, settle in: a rounded, comforting cup with a bright finish. Whole beans for your own brewer and grinder.
              </p>
              {isProposed && (
                <div className="flavour-notes">
                  <span>Cocoa</span>
                  <span>Orange</span>
                  <span>Caramel</span>
                </div>
              )}
              <div className="price-line">
                <strong>{formatMoney(price)}</strong>
                {purchaseType === "subscription" && (
                  <>
                    <del>{formatMoney(variant.priceCents)}</del>
                    <span className="savings">Save 15%</span>
                  </>
                )}
                <span className="currency">USD / {variant.weight}</span>
              </div>
              {isProposed && <p className="price-context">About {formatMoney(cup.centsPerCup)} per complete cup at {dose} g. Coffee only. <button className="text-button" onClick={() => { setPriceDetailsOpen(true); requestAnimationFrame(() => document.getElementById("buyer-guidance")?.scrollIntoView({ behavior: "instant" })); }}>See cost assumptions and compare your routine</button></p>}
              <fieldset className="variant-options">
                <legend>
                  01 <span>Choose your bag</span>
                </legend>
                <div>
                  {VARIANTS.map((item) => (
                    <button
                      key={item.id}
                      aria-pressed={variantId === item.id}
                      onClick={() => {
                        setVariantId(item.id);
                        setError("");
                        track("select_item", { item_id: item.id });
                      }}
                    >
                      {item.weight}
                      {item.stock === 0 && <small>Sold out</small>}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="purchase-options">
                <legend>
                  02 <span>Make it your ritual</span>
                </legend>
                {(["one-time", "subscription"] as const).map((type) => (
                  <label
                    key={type}
                    className={`purchase-card ${purchaseType === type ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="purchase"
                      value={type}
                      checked={purchaseType === type}
                      onChange={() => {
                        setPurchaseType(type);
                        setError("");
                        track("select_purchase_option", {
                          purchase_type: type,
                        });
                      }}
                    />
                    <span>
                      <strong>
                        {type === "one-time"
                          ? "One-time purchase"
                          : "Subscribe & save 15%"}
                      </strong>
                      <small>
                        {type === "one-time"
                          ? "One bag. On your terms."
                          : "Keep your morning ritual stocked. Choose your rhythm."}
                      </small>
                    </span>
                    <b>{formatMoney(unitPrice(variant.priceCents, type))}</b>
                  </label>
                ))}
              </fieldset>
              {purchaseType === "subscription" && (
                <div className="frequency">
                  <label htmlFor="frequency">Delivery frequency</label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(event) => {
                      const value = Number(event.target.value) as Frequency;
                      setFrequency(value);
                      track("select_purchase_option", {
                        delivery_weeks: value,
                      });
                    }}
                  >
                    {[2, 4, 6].map((weeks) => (
                      <option key={weeks} value={weeks}>
                        Every {weeks} weeks
                      </option>
                    ))}
                  </select>
                  <p>
                    {formatMoney(price)} billed every {frequency} weeks. Renews
                    until cancelled. Demo terms: change, pause or cancel before
                    the next renewal. No actual subscription is created.
                  </p>
                </div>
              )}
              <p className={`stock ${remainingStock === 0 ? "out" : ""}`}>
                <span />
                {remainingStock
                  ? `${remainingStock} bags available in this demo`
                  : variant.stock === 0
                    ? "This size is sold out. Choose another bag."
                    : "All available bags are already in your bag."}
              </p>
              <button
                ref={addButton}
                className="add-button"
                disabled={busy || remainingStock === 0}
                onClick={addProduct}
              >
                {busy
                  ? "Updating demo bag…"
                  : remainingStock === 0
                    ? "Unavailable"
                    : "Add to demo bag"}
                <span>
                  {formatMoney(price)} <span aria-hidden="true">↗</span>
                </span>
              </button>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="purchase-footnote">
                <span>Free demo shipping at $60+</span>
                <span>No payment collected</span>
              </div>
              {isProposed && (
                <details id="buyer-guidance" className="buyer-guidance" open={priceDetailsOpen} onToggle={(event) => setPriceDetailsOpen(event.currentTarget.open)}>
                  <summary>Your cost and coffee routine</summary>
                  <p className="eyebrow">A CLEARER WAY TO COMPARE</p>
                  <h3 id="buyer-guidance-title">What does your daily cup cost?</h3>
                  <p>About <strong>{formatMoney(cup.centsPerCup)} per complete cup</strong> from this {variant.weight} bag at {formatMoney(price)}.</p>
                  <label htmlFor="dose">Coffee per cup (grams)</label>
                  <select id="dose" value={dose} onChange={(event) => {
                    const value = Number(event.target.value);
                    setDose(value);
                    track("price_assumption_changed", { dose_grams: value, item_id: variantId });
                  }}>
                    {[15, 18, 20].map((value) => <option key={value} value={value}>{value} g</option>)}
                  </select>
                  <p className="assumption-note">Illustration, not a brew recommendation: {BAG_GRAMS[variantId]} g ÷ {dose} g = {cup.cups} complete cups, with {cup.leftoverGrams} g left. {formatMoney(price)} ÷ {cup.cups}, rounded up to the next cent. Excludes shipping, tax, equipment and waste. Your recipe and yield may differ.</p>
                  <button className="text-button" aria-expanded={guidanceOpen} aria-controls="routine-helper" onClick={() => {
                    setGuidanceOpen(!guidanceOpen);
                    track("buyer_question_opened", { question: "routine", opened: !guidanceOpen });
                  }}>Will this bag fit my routine?</button>
                  <div id="routine-helper" className="routine-helper" hidden={!guidanceOpen}>
                    <p>Compare sizes without changing your selections. This is optional and uses your {dose} g assumption above.</p>
                    <label htmlFor="cups-per-day">Cups per day</label>
                    <select id="cups-per-day" value={cupsPerDay} onChange={(event) => {
                      const value = Number(event.target.value);
                      setCupsPerDay(value);
                      track("routine_preview_changed", { cups_per_day: value, item_id: previewBag });
                    }}>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}</select>
                    <label htmlFor="preview-bag">Compare a bag</label>
                    <select id="preview-bag" value={previewBag} onChange={(event) => {
                      setPreviewBag(event.target.value);
                      track("routine_preview_changed", { cups_per_day: cupsPerDay, item_id: event.target.value });
                    }}>{VARIANTS.filter((item) => item.stock > 0).map((item) => <option key={item.id} value={item.id}>{item.weight}</option>)}</select>
                    <p role="status">{routineVariant.weight} makes {routineCups.cups} complete cups: about {(routineCups.cups / cupsPerDay).toFixed(1)} days at {cupsPerDay} {cupsPerDay === 1 ? "cup" : "cups"} a day.</p>
                    <button className="secondary-button" disabled={busy} onClick={() => {
                      setVariantId(previewBag);
                      setError("");
                      setNotice(`Selected ${routineVariant.weight}. Your purchase option and delivery interval are unchanged.`);
                      track("routine_selection_applied", { item_id: previewBag, cups_per_day: cupsPerDay, dose_grams: dose });
                    }}>Use this bag size</button>
                    <p className="assumption-note">Only changes bag size. It does not add to your bag, choose a subscription or change its interval. Check availability and delivery timing above.</p>
                  </div>
                </details>
              )}
              {isProposed && (
                <div className="product-details">
                  <details>
                    <summary>
                      The coffee, considered <span>+</span>
                    </summary>
                    <p>
                      Fictional tasting profile: medium roast, whole bean. These
                      details illustrate a product information hierarchy, with
                      no origin, certification or health claims.
                    </p>
                  </details>
                  <details>
                    <summary>
                      Delivery & subscription terms <span>+</span>
                    </summary>
                    <p>
                      Demo shipping is $5 below $60 and free at $60. Tax is
                      excluded. Subscriptions recur at the selected frequency;
                      the scoop is a one-time item. Final shipping and tax
                      belong to real checkout.
                    </p>
                  </details>
                </div>
              )}
            </div>
          </div>
          {isProposed && <>
            <section className="ritual-extras" aria-label="Complete your ritual">
              <div className="ritual-extras-heading"><p className="eyebrow">ONLY IF IT FITS YOUR ROUTINE</p><h2>Make room for the everyday.</h2><p>Optional choices. Nothing is added or subscribed automatically.</p></div>
              <div className="ritual-extras-grid">
                <article className="ritual-extra-card">
                  <span className="extra-illustration" aria-hidden="true">250 → 500</span>
                  <div><p className="eyebrow">MORE TO SHARE</p><h3>A bigger bag for more mornings.</h3><p>500 g · {formatMoney(unitPrice(largerBag.priceCents, purchaseType))}{purchaseType === "subscription" ? ` every ${frequency} weeks` : " one time"}. Twice the coffee of 250 g, for {formatMoney(unitPrice(largerBag.priceCents, purchaseType) - unitPrice(VARIANTS[0].priceCents, purchaseType))} more per bag.</p><p className="extra-note">Choose based on how quickly you use it. Bigger is not always the better fit.</p>
                  <button className="secondary-button" disabled={busy || variantId === largerBag.id || largerStock <= 0} onClick={() => {
                    setVariantId(largerBag.id); setError("");
                    setNotice("500 g selected. Your purchase option and interval are unchanged. Add it only when you are ready.");
                    track("product_upsell_selected", { item_id: largerBag.id, purchase_type: purchaseType });
                    addButton.current?.focus();
                  }}>{variantId === largerBag.id ? "500 g selected" : largerStock <= 0 ? "500 g unavailable" : "Choose 500 g instead"}</button></div>
                </article>
                <article className="ritual-extra-card">
                  <span className="extra-illustration scoop-illustration" aria-hidden="true">↳</span>
                  <div><p className="eyebrow">A SMALL COMPANION</p><h3>A scoop for your coffee corner.</h3>
                  <p>Reusable stainless-steel measuring scoop · {formatMoney(UPSELL.priceCents)} once.</p><p className="extra-note">For transferring beans or grounds. A scoop is not a precision scale; weigh your dose if your recipe calls for grams.</p>
                  {hasScoop ? <p className="extra-status" role="status">Already in your bag · one time only</p> : dismissed ? <p className="extra-status">Offer hidden by you. Reset demo restores it.</p> : <><button className="secondary-button" disabled={busy} onClick={addScoop}>Add scoop to demo bag</button><button className="text-button" onClick={dismissUpsell}>Hide scoop recommendation</button></>}
                  </div>
                </article>
              </div>
            </section>
            <RitualStory key={resetGeneration} />
          </>}
          <div className="store-footer">
            <span>GOOD COFFEE. CLEAR CHOICES.</span>
            <span>
              A fictional store. Practice here before changing your real store.
            </span>
          </div>
        </section>

        </div>

        <details id="developer-details" className="developer-details">
          <summary>Developer details · optional</summary>
          <p className="developer-intro">For the person building or checking your store: implementation notes, simulated errors and local activity records. You do not need these to use the guide.</p>
        <section id="evidence" className="evidence-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE THINKING BEHIND THE INTERFACE</p>
              <h2>Every choice is a hypothesis.</h2>
            </div>
            <p>
              Implementation evidence, not conversion promises.
              <br />
              These designs have no live experiment results.
            </p>
          </div>
          <div className="evidence-grid">
            <Evidence
              number="01"
              title="A clear commitment"
              label="SUBSCRIPTION PRODUCT PAGE"
              hypothesis="Showing the price, savings and renewal terms at the decision point may improve informed subscription selection."
              metric="Subscription attach rate among eligible product-page sessions."
              guardrail="Purchase conversion, early cancellation and subscription support contacts."
              source="components/cro-lab.tsx"
              tests="tests/commerce.test.ts"
              onTry={() =>
                document
                  .getElementById("storefront")
                  ?.scrollIntoView({ behavior: "instant" })
              }
            />
            <Evidence
              number="02"
              title="A resilient next step"
              label="CART & CONTEXTUAL UPSELL"
              hypothesis="An editable cart and one relevant, dismissible accessory may help shoppers complete their intended basket."
              metric="Completed purchases per eligible cart session."
              guardrail="Cart error rate, checkout abandonment, margin and refund rate."
              source="lib/commerce.ts"
              tests="tests/browser.spec.ts"
              onTry={openCart}
            />
            <Evidence
              number="03"
              title="An inspectable experiment"
              label="LOCAL EVENT INSTRUMENTATION"
              hypothesis="Explicit assignments and predictable event contracts make implementation QA easier before a controlled test."
              metric="Event contract coverage and missing or duplicate event rate during QA."
              guardrail="No personal data, no network transmission, no fabricated experiment results."
              source="lib/events.ts"
              tests="tests/events.test.ts"
              onTry={() =>
                document
                  .getElementById("inspector")
                  ?.scrollIntoView({ behavior: "instant" })
              }
            />
          </div>
        </section>

        <section id="inspector" className="inspector">
          <div className="inspector-controls">
            <p className="eyebrow">UNDER THE HOOD</p>
            <h2>Try the edge cases.</h2>
            <p>
              Deterministic fixtures. A local cart adapter. The same pricing
              rules in both designs.
            </p>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={latency}
                disabled={busy}
                onChange={(event) => setLatency(event.target.checked)}
              />
              <span>
                Simulate 1.2s latency
                <small>Test busy states and repeated clicks.</small>
              </span>
            </label>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={failNext}
                disabled={busy}
                onChange={(event) => setFailNext(event.target.checked)}
              />
              <span>
                Fail the next cart request
                <small>One failure, then normal behaviour.</small>
              </span>
            </label>
            <div className="integration-note">
              <strong>Vercel demo ≠ Shopify runtime</strong>
              <p>
                No requests reach Shopify, a payment service or analytics. A
                separate OS 2.0 Liquid section uses real selling-plan
                allocations in a Shopify theme.
              </p>
              <a
                href={`${REPO}liquid-sections/subscription-hero/subscription-hero.liquid`}
                target="_blank"
                rel="noreferrer"
              >
                Read the Liquid integration ↗
              </a>
            </div>
          </div>
          <div className="event-viewer">
            <div className="event-heading">
              <div>
                <span className="live-dot" /> LOCAL EVENT STREAM
              </div>
              <span>{events.length} / 30 recent events</span>
            </div>
            <p className="event-caption">
              Simulated payloads · Memory only · Nothing transmitted
            </p>
            <div
              className="event-list"
              tabIndex={0}
              aria-label="Analytics event payloads"
            >
              {events.map((event, index) => (
                <details key={event.sequence} open={index === 0}>
                  <summary>
                    <span className="event-sequence">
                      {String(event.sequence).padStart(2, "0")}
                    </span>
                    <span>{event.name}</span>
                    <small>SIMULATED</small>
                    <span>+</span>
                  </summary>
                  <pre>{JSON.stringify(event, null, 2)}</pre>
                </details>
              ))}
            </div>
          </div>
        </section>

        </details>

        <section className="method-note">
          <span>↳</span>
          <div>
            <h2>From a demo to a defensible result.</h2>
            <p>
              A live test would need a verified Shopify implementation, stable
              visitor assignment, consent-aware measurement, a predeclared
              sample size and duration, and a review of guardrails. No lift is
              claimed here.
            </p>
            <a
              href={`${REPO}docs/TESTING-GUIDE.md`}
              target="_blank"
              rel="noreferrer"
            >
              Read the validation plan ↗
            </a>
          </div>
        </section>
      </main>
      <footer className="lab-footer">
        <div className="lab-logo">
          cro<span>lab</span>
          <span className="logo-slash">/</span>
        </div>
        <p>
          Designed & built by Thomas Maghanga.
          <br />
          <span>
            Practical store improvements. Honest evidence. No promised results.
          </span>
        </p>
        <a
          href={REPO.replace("/blob/development/", "/tree/development/")}
          target="_blank"
          rel="noreferrer"
        >
          Explore the repository ↗
        </a>
      </footer>
      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>

      {view === "shop" && stickyVisible && (
        <div className="sticky-atc" data-testid="sticky-atc">
          <div>
            <strong>Daybreak / {variant.weight}</strong>
            <span>
              {formatMoney(price)}
              {purchaseType === "subscription"
                ? ` every ${frequency} weeks`
                : " · one time"}
            </span>
          </div>
          <button disabled={busy || remainingStock === 0} onClick={addProduct}>
            {busy
              ? "Updating…"
              : remainingStock === 0
                ? "Sold out"
                : "Add to bag ↗"}
          </button>
        </div>
      )}

      <dialog
        ref={dialog}
        className="cart-dialog"
        aria-labelledby="cart-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const targets = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]',
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = targets[0];
          const last = targets[targets.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          (returnFocus.current ?? addButton.current)?.focus();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="cart-shell">
          <div className="cart-header">
            <div>
              <p className="eyebrow">FORM & FIELD / DEMO</p>
              <h2 id="cart-title">
                Your bag <span>({totals.itemCount})</span>
              </h2>
            </div>
            <button
              className="icon-button"
              aria-label="Close bag"
              onClick={() => dialog.current?.close()}
            >
              ✕
            </button>
          </div>
          <div className="cart-body">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <span aria-hidden="true">↗</span>
                <h3>A fresh start.</h3>
                <p>
                  Your demo bag is empty. Choose a coffee and make it your
                  ritual.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    dialog.current?.close();
                    addButton.current?.focus();
                  }}
                >
                  Explore Daybreak
                </button>
              </div>
            ) : (
              <>
                <div className="shipping-progress">
                  <p>
                    {totals.remainingForFreeShippingCents > 0 ? (
                      <>
                        <strong>
                          {formatMoney(totals.remainingForFreeShippingCents)}
                        </strong>{" "}
                        away from free demo shipping
                      </>
                    ) : (
                      <strong>Free demo shipping unlocked</strong>
                    )}
                  </p>
                  <progress
                    max={SHIPPING_THRESHOLD_CENTS}
                    value={Math.min(
                      totals.subtotalCents,
                      SHIPPING_THRESHOLD_CENTS,
                    )}
                    aria-label="Progress toward free demo shipping"
                  />
                  <small>Calculated after subscription savings.</small>
                </div>
                <ul className="cart-lines">
                  {cart.map((line) => (
                    <li key={line.key}>
                      <div className="line-thumbnail" aria-hidden="true">
                        {line.variantId === UPSELL.id ? "↳" : "f&f"}
                      </div>
                      <div className="line-info">
                        <h3>{line.title}</h3>
                        <p>
                          {line.weight} ·{" "}
                          {line.purchaseType === "subscription"
                            ? `Every ${line.frequency} weeks`
                            : "One-time purchase"}
                        </p>
                        <span>{formatMoney(line.unitPriceCents)} each</span>
                        <div className="line-actions">
                          <div className="quantity-control">
                            <button
                              disabled={busy}
                              aria-label={`Decrease ${line.title} ${line.weight} ${line.purchaseType}${line.frequency ? ` every ${line.frequency} weeks` : ""}`}
                              onClick={() =>
                                void mutate("quantity", (lines) =>
                                  setLineQuantity(
                                    lines,
                                    line.key,
                                    line.quantity - 1,
                                  ),
                                )
                              }
                            >
                              −
                            </button>
                            <output
                              aria-label={`Quantity of ${line.title} ${line.weight}`}
                            >
                              {line.quantity}
                            </output>
                            <button
                              disabled={
                                busy ||
                                cart
                                  .filter(
                                    (item) => item.variantId === line.variantId,
                                  )
                                  .reduce(
                                    (sum, item) => sum + item.quantity,
                                    0,
                                  ) >= line.stock
                              }
                              aria-label={`Increase ${line.title} ${line.weight} ${line.purchaseType}${line.frequency ? ` every ${line.frequency} weeks` : ""}`}
                              onClick={() =>
                                void mutate("quantity", (lines) =>
                                  setLineQuantity(
                                    lines,
                                    line.key,
                                    line.quantity + 1,
                                  ),
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="remove-button"
                            disabled={busy}
                            onClick={() =>
                              void mutate("remove", (lines) =>
                                setLineQuantity(lines, line.key, 0),
                              )
                            }
                            aria-label={`Remove ${line.title} ${line.weight} ${line.purchaseType}${line.frequency ? ` every ${line.frequency} weeks` : ""}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <strong>
                        {formatMoney(line.unitPriceCents * line.quantity)}
                      </strong>
                    </li>
                  ))}
                </ul>
                {isProposed &&
                  !dismissed &&
                  cart.some((line) => line.variantId !== UPSELL.id) &&
                  !cart.some((line) => line.variantId === UPSELL.id) && (
                    <div className="upsell">
                      <div>
                        <p className="eyebrow">A USEFUL COMPANION</p>
                        <h3>A measured morning.</h3>
                        <p>
                          Reusable measuring scoop ·{" "}
                          {formatMoney(UPSELL.priceCents)}
                        </p>
                        <small>Optional. Added once, never recurring. For scooping—not a precision scale.</small>
                      </div>
                      <button
                        aria-label="Dismiss scoop offer"
                        className="dismiss-upsell"
                        onClick={dismissUpsell}
                      >
                        ✕
                      </button>
                      <button
                        className="secondary-button"
                        disabled={busy}
                        onClick={() =>
                          void mutate("add", (lines) =>
                            addLine(
                              lines,
                              selectionToLine({
                                variantId: UPSELL.id,
                                purchaseType: "one-time",
                                quantity: 1,
                              }),
                            ),
                          )
                        }
                      >
                        Add the scoop + {formatMoney(UPSELL.priceCents)}
                      </button>
                    </div>
                  )}
              </>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <p role="status" className="cart-status">
              {busy ? "Updating your demo bag…" : notice}
            </p>
          </div>
          {cart.length > 0 && (
            <div className="cart-totals">
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(totals.subtotalCents)}</dd>
                </div>
                <div>
                  <dt>Demo shipping</dt>
                  <dd>
                    {totals.shippingCents === 0
                      ? "Free"
                      : formatMoney(totals.shippingCents)}
                  </dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>Not calculated</dd>
                </div>
                <div className="total-row">
                  <dt>Demo total</dt>
                  <dd>{formatMoney(totals.totalCents)}</dd>
                </div>
              </dl>
              {totals.recurringSubtotalCents > 0 && (
                <p className="renewal-note">
                  This first-order total includes{" "}
                  {formatMoney(totals.oneTimeSubtotalCents)} in one-time items.
                  Recurring items renew separately at their listed intervals;
                  future shipping and tax are not calculated.
                </p>
              )}
              <div className="checkout-disabled">Demo only — no checkout</div>
              <p>USD. No order or subscription will be created.</p>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

function Evidence({
  number,
  title,
  label,
  hypothesis,
  metric,
  guardrail,
  source,
  tests,
  onTry,
}: {
  number: string;
  title: string;
  label: string;
  hypothesis: string;
  metric: string;
  guardrail: string;
  source: string;
  tests: string;
  onTry: () => void;
}) {
  return (
    <article className="evidence-card">
      <div className="card-top">
        <span>{number}</span>
        <span>↗</span>
      </div>
      <p className="eyebrow">{label}</p>
      <h3>{title}</h3>
      <p>{hypothesis}</p>
      <details>
        <summary>
          Why this approach <span>+</span>
        </summary>
        <dl>
          <dt>Primary metric / validation</dt>
          <dd>{metric}</dd>
          <dt>Guardrails</dt>
          <dd>{guardrail}</dd>
        </dl>
      </details>
      <div className="card-links">
        <button onClick={onTry}>Try it ↗</button>
        <a href={`${REPO}${source}`} target="_blank" rel="noreferrer">
          Source
        </a>
        <a href={`${REPO}${tests}`} target="_blank" rel="noreferrer">
          Tests
        </a>
      </div>
    </article>
  );
}

