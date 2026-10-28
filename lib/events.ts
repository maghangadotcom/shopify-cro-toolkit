export const EVENT_NAMES = [
  "view_item",
  "select_item",
  "select_purchase_option",
  "add_to_cart",
  "cart_updated",
  "upsell_dismissed",
  "experiment_viewed",
  "request_failed",
  "demo_reset",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];
export type EventValue = string | number | boolean | null;
export type EventPayload = Readonly<Record<string, EventValue>>;
export interface LabEvent {
  name: EventName;
  sequence: number;
  simulation: true;
  destination: "local-only";
  payload: Record<string, EventValue>;
}

/** Local inspector records only. Does not touch a data layer, network, cookies or analytics SDK. */
export function createEvent(
  name: EventName,
  payload: EventPayload,
  sequence: number,
): LabEvent {
  if (!(EVENT_NAMES as readonly string[]).includes(name))
    throw new Error("Unknown demo event.");
  if (!Number.isSafeInteger(sequence) || sequence < 1)
    throw new Error("Event sequence must be a positive safe integer.");
  const snapshot: Record<string, EventValue> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key))
      throw new Error("Invalid event field name.");
    if (
      value !== null &&
      !["string", "number", "boolean"].includes(typeof value)
    )
      throw new Error("Event fields must be scalar values.");
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("Event numbers must be finite.");
    // Define explicitly so even a field named __proto__ cannot alter the snapshot prototype.
    Object.defineProperty(snapshot, key, {
      value,
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }
  return {
    name,
    sequence,
    simulation: true,
    destination: "local-only",
    payload: snapshot,
  };
}
