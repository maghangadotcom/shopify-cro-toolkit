import { test } from "node:test";
import assert from "node:assert/strict";
import { createEvent, EVENT_NAMES } from "../lib/events.ts";
import type { EventName, EventPayload } from "../lib/events.ts";

test("events are deterministic, sequenced and explicitly local simulations", () => {
  const payload = {
    variantId: "daybreak-250",
    quantity: 2,
    currency: "USD",
    valueCents: 4080,
  };
  const event = createEvent("add_to_cart", payload, 3);
  assert.deepEqual(event, {
    name: "add_to_cart",
    sequence: 3,
    simulation: true,
    destination: "local-only",
    payload,
  });
  assert.deepEqual(createEvent("add_to_cart", payload, 3), event);
  payload.quantity = 7;
  assert.equal(event.payload.quantity, 2);
});

test("every declared event can be inspected without transmission or timestamps", () => {
  EVENT_NAMES.forEach((name, index) => {
    const event = createEvent(name, {}, index + 1);
    assert.equal(event.name, name);
    assert.equal("timestamp" in event, false);
  });
});

test("invalid names, sequences and payloads fail before recording", () => {
  assert.throws(() => createEvent("purchase" as EventName, {}, 1), /Unknown/);
  for (const sequence of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => createEvent("view_item", {}, sequence));
  }
  assert.throws(() => createEvent("view_item", { valueCents: NaN }, 1));
  assert.throws(
    () =>
      createEvent("view_item", { nested: {} } as unknown as EventPayload, 1),
    /scalar/,
  );
  assert.throws(
    () => createEvent("view_item", { "bad key": "value" }, 1),
    /field name/,
  );
});
