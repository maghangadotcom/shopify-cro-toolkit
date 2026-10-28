import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addLine,
  cartTotals,
  formatMoney,
  lineKey,
  selectionToLine,
  setLineQuantity,
  unitPrice,
  validateQuantity,
} from "../lib/commerce.ts";
import type { CartLine, PurchaseType, Selection } from "../lib/commerce.ts";
import { UPSELL } from "../lib/fixtures.ts";

const selection = (overrides: Partial<Selection> = {}): Selection => ({
  variantId: "daybreak-250",
  purchaseType: "one-time",
  quantity: 1,
  ...overrides,
});

test("unit discount rounds once per unit, half up, in integer cents", () => {
  assert.equal(unitPrice(2400, "subscription"), 2040);
  assert.equal(unitPrice(10, "subscription"), 9);
  assert.equal(unitPrice(1999, "subscription"), 1699);
  assert.equal(unitPrice(2400, "one-time"), 2400);
  assert.equal(
    unitPrice(Number.MAX_SAFE_INTEGER, "subscription"),
    Number((BigInt(Number.MAX_SAFE_INTEGER) * 85n + 50n) / 100n),
  );
  assert.throws(() => unitPrice(-1, "one-time"));
  assert.throws(() => unitPrice(1.5, "one-time"));
  assert.throws(() => unitPrice(Number.MAX_SAFE_INTEGER + 1, "one-time"));
  assert.throws(() => unitPrice(10, "other" as PurchaseType));
});

test("USD formatting has deterministic locale and two decimal places", () => {
  assert.equal(formatMoney(0), "$0.00");
  assert.equal(formatMoney(2040), "$20.40");
  assert.equal(formatMoney(123456), "$1,234.56");
  assert.equal(formatMoney(Number.MAX_SAFE_INTEGER), "$90,071,992,547,409.91");
  assert.throws(() => formatMoney(NaN));
});

test("selection resolves inventory, ignores one-time frequency and keeps delivery plans separate", () => {
  const once = selectionToLine(selection({ frequency: 2 }));
  const two = selectionToLine(
    selection({ purchaseType: "subscription", frequency: 2 }),
  );
  const four = selectionToLine(
    selection({ purchaseType: "subscription", frequency: 4 }),
  );
  assert.equal(once.frequency, undefined);
  assert.equal(two.unitPriceCents, 2040);
  assert.equal(new Set([once.key, two.key, four.key]).size, 3);
  assert.throws(
    () => selectionToLine(selection({ variantId: "unknown" })),
    /unavailable/,
  );
  assert.throws(
    () => selectionToLine(selection({ variantId: "daybreak-1000" })),
    /sold out/,
  );
  assert.throws(
    () => selectionToLine(selection({ purchaseType: "subscription" })),
    /delivery/,
  );
  assert.throws(
    () =>
      selectionToLine(
        selection({
          variantId: UPSELL.id,
          purchaseType: "subscription",
          frequency: 4,
        }),
      ),
    /one-time/,
  );
});

test("identical line additions combine immutably; different plans do not combine", () => {
  const line = selectionToLine(selection());
  const original = [line];
  const combined = addLine(original, line);
  assert.equal(combined.length, 1);
  assert.equal(combined[0].quantity, 2);
  assert.equal(original[0].quantity, 1);
  const withPlan = addLine(
    combined,
    selectionToLine(selection({ purchaseType: "subscription", frequency: 2 })),
  );
  assert.equal(withPlan.length, 2);
});

test("stock is shared across one-time and every subscription frequency", () => {
  const six = selectionToLine(selection({ quantity: 6 }));
  const two = selectionToLine(
    selection({ purchaseType: "subscription", frequency: 2, quantity: 2 }),
  );
  const cart = addLine([six], two);
  assert.equal(cartTotals(cart).itemCount, 8);
  assert.throws(() => addLine(cart, selectionToLine(selection())), /Only 8/);
  assert.throws(() => setLineQuantity(cart, two.key, 3), /Only 8/);
  assert.equal(cart[1].quantity, 2);
});

test("quantity changes remove at zero and reject invalid values without mutation", () => {
  const line = selectionToLine(selection());
  assert.deepEqual(setLineQuantity([line], line.key, 0), []);
  for (const quantity of [-1, 1.5, Infinity, NaN, 9]) {
    assert.throws(() => setLineQuantity([line], line.key, quantity));
  }
  assert.throws(() => setLineQuantity([], line.key, 1), /no longer/);
  assert.throws(() => validateQuantity(0, 8));
  assert.equal(validateQuantity(0, 8, true), 0);
  assert.equal(line.quantity, 1);
});

test("shipping boundary uses discounted subtotal and handles an empty cart", () => {
  const base = selectionToLine(selection());
  const amount = (unitPriceCents: number): CartLine[] => [
    { ...base, unitPriceCents },
  ];
  assert.equal(cartTotals(amount(5999)).shippingCents, 500);
  assert.equal(cartTotals(amount(5999)).remainingForFreeShippingCents, 1);
  assert.equal(cartTotals(amount(6000)).shippingCents, 0);
  assert.equal(cartTotals(amount(6000)).freeShippingProgress, 100);
  assert.equal(cartTotals(amount(6001)).freeShippingProgress, 100);
  const discounted = selectionToLine(
    selection({ purchaseType: "subscription", frequency: 4, quantity: 2 }),
  );
  assert.equal(cartTotals([discounted]).subtotalCents, 4080);
  assert.equal(cartTotals([discounted]).remainingForFreeShippingCents, 1920);
  assert.deepEqual(cartTotals([]), {
    subtotalCents: 0,
    shippingCents: 0,
    totalCents: 0,
    remainingForFreeShippingCents: 6000,
    freeShippingProgress: 0,
    oneTimeSubtotalCents: 0,
    recurringSubtotalCents: 0,
    itemCount: 0,
  });
});

test("mixed cart keeps recurring merchandise separate from one-time scoop and shipping", () => {
  const coffee = selectionToLine(
    selection({ purchaseType: "subscription", frequency: 4, quantity: 2 }),
  );
  const scoop = selectionToLine(selection({ variantId: UPSELL.id }));
  const totals = cartTotals([coffee, scoop]);
  assert.equal(totals.recurringSubtotalCents, 4080);
  assert.equal(totals.oneTimeSubtotalCents, 800);
  assert.equal(totals.subtotalCents, 4880);
  assert.equal(totals.shippingCents, 500);
  assert.equal(totals.totalCents, 5380);
});

test("invalid or overflowing monetary values cannot silently enter totals", () => {
  const line = selectionToLine(selection());
  assert.throws(() => cartTotals([{ ...line, unitPriceCents: -1 }]));
  assert.throws(() =>
    cartTotals([
      { ...line, unitPriceCents: Number.MAX_SAFE_INTEGER, quantity: 2 },
    ]),
  );
  assert.throws(() => cartTotals([{ ...line, key: "mismatched" }]));
  assert.throws(() => cartTotals([line, line]), /Duplicate/);
  assert.notEqual(lineKey("a:b", "one-time"), lineKey("a", "subscription", 2));
});
