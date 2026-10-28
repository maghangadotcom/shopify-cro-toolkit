import {
  VARIANTS,
  UPSELL,
  CURRENCY,
  FREQUENCIES,
  SHIPPING_CENTS,
  SHIPPING_THRESHOLD_CENTS,
  SUBSCRIPTION_DISCOUNT_PERCENT,
} from "./fixtures.ts";

export type { ProductVariant } from "./fixtures.ts";
export type PurchaseType = "one-time" | "subscription";
export type Frequency = (typeof FREQUENCIES)[number];

export interface Selection {
  variantId: string;
  purchaseType: PurchaseType;
  frequency?: Frequency;
  quantity: number;
}

export interface CartLine extends Selection {
  key: string;
  title: string;
  weight: string;
  unitPriceCents: number;
  stock: number;
}

function safeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
  return value;
}

function purchaseOption(
  purchaseType: PurchaseType,
  frequency?: Frequency,
): void {
  if (purchaseType !== "one-time" && purchaseType !== "subscription") {
    throw new Error("Choose one-time purchase or subscription.");
  }
  if (
    purchaseType === "subscription" &&
    !FREQUENCIES.includes(frequency as Frequency)
  ) {
    throw new Error("Choose delivery every 2, 4 or 6 weeks.");
  }
}

/** Round once per unit, half up, with no floating-point currency arithmetic. */
export function unitPrice(
  baseCents: number,
  purchaseType: PurchaseType,
): number {
  safeInteger(baseCents, "Price");
  if (purchaseType !== "one-time" && purchaseType !== "subscription") {
    throw new Error("Choose one-time purchase or subscription.");
  }
  if (purchaseType === "one-time") return baseCents;
  const rate = BigInt(100 - SUBSCRIPTION_DISCOUNT_PERCENT);
  return Number((BigInt(baseCents) * rate + 50n) / 100n);
}

export function formatMoney(cents: number): string {
  safeInteger(cents, "Price");
  const amount = BigInt(cents);
  const fraction = (amount % 100n).toString().padStart(2, "0");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
  })
    .formatToParts(amount / 100n)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
}

/** Zero is reserved for removing an existing line. */
export function validateQuantity(
  quantity: number,
  stock = Number.MAX_SAFE_INTEGER,
  allowZero = false,
): number {
  safeInteger(stock, "Stock");
  if (!Number.isSafeInteger(quantity) || quantity < (allowZero ? 0 : 1)) {
    throw new Error(
      allowZero
        ? "Quantity must be a whole number of zero or more."
        : "Quantity must be a whole number of at least one.",
    );
  }
  if (quantity > stock)
    throw new Error(
      stock === 0
        ? "This option is sold out."
        : `Only ${stock} available in this demo.`,
    );
  return quantity;
}

export function lineKey(
  variantId: string,
  purchaseType: PurchaseType,
  frequency?: Frequency,
): string {
  if (typeof variantId !== "string" || !variantId.trim())
    throw new Error("Choose a product option.");
  purchaseOption(purchaseType, frequency);
  return `${encodeURIComponent(variantId)}:${purchaseType}:${purchaseType === "subscription" ? frequency : "once"}`;
}

export function selectionToLine(selection: Selection): CartLine {
  const variant = [...VARIANTS, UPSELL].find(
    (item) => item.id === selection.variantId,
  );
  if (!variant) throw new Error("This product option is unavailable.");
  purchaseOption(selection.purchaseType, selection.frequency);
  if (variant.id === UPSELL.id && selection.purchaseType !== "one-time") {
    throw new Error("The measuring scoop is a one-time purchase.");
  }
  validateQuantity(selection.quantity, variant.stock);
  const frequency =
    selection.purchaseType === "subscription" ? selection.frequency : undefined;
  return {
    key: lineKey(variant.id, selection.purchaseType, frequency),
    variantId: variant.id,
    title: variant.title,
    weight: variant.weight,
    purchaseType: selection.purchaseType,
    ...(frequency === undefined ? {} : { frequency }),
    unitPriceCents: unitPrice(variant.priceCents, selection.purchaseType),
    quantity: selection.quantity,
    stock: variant.stock,
  };
}

function validateLines(lines: readonly CartLine[]): void {
  const inventory = new Map<string, { quantity: number; stock: number }>();
  const keys = new Set<string>();
  for (const line of lines) {
    if (line.key !== lineKey(line.variantId, line.purchaseType, line.frequency))
      throw new Error("Invalid cart line key.");
    if (keys.has(line.key)) throw new Error("Duplicate cart line.");
    keys.add(line.key);
    safeInteger(line.unitPriceCents, "Price");
    validateQuantity(line.quantity, line.stock);
    const existing = inventory.get(line.variantId);
    const quantity = safeInteger(
      (existing?.quantity ?? 0) + line.quantity,
      "Quantity",
    );
    const stock = Math.min(existing?.stock ?? line.stock, line.stock);
    validateQuantity(quantity, stock);
    inventory.set(line.variantId, { quantity, stock });
  }
}

/** Immutable, atomic update. Inventory is shared across purchase plans for a variant. */
export function addLine(
  lines: readonly CartLine[],
  addition: CartLine,
): CartLine[] {
  validateLines(lines);
  validateLines([addition]);
  const existing = lines.find((line) => line.key === addition.key);
  if (
    existing &&
    (existing.unitPriceCents !== addition.unitPriceCents ||
      existing.stock !== addition.stock)
  ) {
    throw new Error("Product details changed. Reset the demo and try again.");
  }
  const next = existing
    ? lines.map((line) =>
        line.key === addition.key
          ? {
              ...line,
              quantity: safeInteger(
                line.quantity + addition.quantity,
                "Quantity",
              ),
            }
          : { ...line },
      )
    : [...lines.map((line) => ({ ...line })), { ...addition }];
  validateLines(next);
  return next;
}

export function setLineQuantity(
  lines: readonly CartLine[],
  key: string,
  quantity: number,
): CartLine[] {
  validateLines(lines);
  const current = lines.find((line) => line.key === key);
  if (!current) throw new Error("This item is no longer in your cart.");
  validateQuantity(quantity, current.stock, true);
  const next =
    quantity === 0
      ? lines.filter((line) => line.key !== key).map((line) => ({ ...line }))
      : lines.map((line) =>
          line.key === key ? { ...line, quantity } : { ...line },
        );
  validateLines(next);
  return next;
}

export function cartTotals(lines: readonly CartLine[]) {
  validateLines(lines);
  let oneTimeSubtotalCents = 0;
  let recurringSubtotalCents = 0;
  let itemCount = 0;
  for (const line of lines) {
    const lineTotal = safeInteger(
      line.unitPriceCents * line.quantity,
      "Line total",
    );
    if (line.purchaseType === "subscription")
      recurringSubtotalCents = safeInteger(
        recurringSubtotalCents + lineTotal,
        "Subtotal",
      );
    else
      oneTimeSubtotalCents = safeInteger(
        oneTimeSubtotalCents + lineTotal,
        "Subtotal",
      );
    itemCount = safeInteger(itemCount + line.quantity, "Item count");
  }
  const subtotalCents = safeInteger(
    oneTimeSubtotalCents + recurringSubtotalCents,
    "Subtotal",
  );
  const shippingCents =
    itemCount > 0 && subtotalCents < SHIPPING_THRESHOLD_CENTS
      ? SHIPPING_CENTS
      : 0;
  return {
    subtotalCents,
    shippingCents,
    totalCents: safeInteger(subtotalCents + shippingCents, "Total"),
    remainingForFreeShippingCents: Math.max(
      0,
      SHIPPING_THRESHOLD_CENTS - subtotalCents,
    ),
    freeShippingProgress: Math.min(
      100,
      (subtotalCents / SHIPPING_THRESHOLD_CENTS) * 100,
    ),
    oneTimeSubtotalCents,
    recurringSubtotalCents,
    itemCount,
  };
}
