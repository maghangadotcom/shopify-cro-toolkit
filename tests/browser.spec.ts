import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// Every test independently verifies the local-only promise and catches browser errors.
const test = base.extend<{ browserAudit: void }>({
  browserAudit: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const externalRequests: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error")
          errors.push(`${message.text()} (${message.location().url})`);
      });
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (
          /^https?:$/.test(url.protocol) &&
          !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
        ) {
          externalRequests.push(url.href);
        }
      });
      await use();
      expect(errors, "No JavaScript or console errors").toEqual([]);
      expect(
        externalRequests,
        "No commerce or analytics requests leave localhost",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

const bag = (page: Page) => page.getByRole("button", { name: /^Your bag/ });
const add = (page: Page) =>
  page.getByRole("button", { name: /^Add to demo bag/ });
const drawer = (page: Page) => page.locator("dialog");
const quantity = (page: Page) =>
  drawer(page).getByLabel("Quantity of Daybreak 250 g", { exact: true });
const newestEvent = async (page: Page) =>
  JSON.parse(
    (await page
      .locator(".event-list details")
      .first()
      .locator("pre")
      .textContent())!,
  );

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Shopper preview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Daybreak blend" }),
  ).toBeVisible();
  // Engineering controls are optional; merchant guidance is the default view.
  await page.locator("#developer-details > summary").click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
});

test("responsive product selection, sold-out state and baseline retain deterministic pricing", async ({
  page,
}, testInfo) => {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/review-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /1 kg/ }).click();
  await expect(
    page.getByRole("button", { name: /^Unavailable/ }),
  ).toBeDisabled();
  await expect(
    page.getByText("This size is sold out. Choose another bag."),
  ).toBeVisible();
  await page.getByRole("button", { name: "500 g", exact: true }).click();
  await page.getByRole("radio", { name: /Subscribe & save 15%/ }).check();
  await page
    .getByLabel("Delivery frequency", { exact: true })
    .selectOption("6");
  await expect(page.locator(".price-line > strong")).toHaveText("$35.70");
  await expect(page.locator(".frequency p")).toContainText(
    "$35.70 billed every 6 weeks",
  );
  await page.getByRole("button", { name: "Baseline", exact: true }).click();
  await expect(page.locator(".price-line > strong")).toHaveText("$35.70");
  await expect(
    page.getByLabel("Delivery frequency", { exact: true }),
  ).toHaveValue("6");
  await expect(
    page.getByRole("button", { name: "Baseline", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await add(page).click();
  await expect(drawer(page)).toBeVisible();
  await expect(
    drawer(page).getByText("500 g · Every 6 weeks", { exact: true }),
  ).toBeVisible();
  await expect(drawer(page).getByText("$40.70", { exact: true })).toBeVisible();
  expect(
    await drawer(page).evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
});

test("cart quantities, discounted shipping threshold and one-time upsell stay transparent", async ({
  page,
}, testInfo) => {
  await page.getByRole("radio", { name: /Subscribe & save 15%/ }).check();
  await add(page).click();
  await expect(quantity(page)).toHaveText("1");
  await expect(drawer(page).getByText("$39.60", { exact: true })).toBeVisible();
  await drawer(page)
    .getByRole("button", {
      name: "Increase Daybreak 250 g subscription every 4 weeks",
      exact: true,
    })
    .click();
  await expect(quantity(page)).toHaveText("2");
  await expect(drawer(page).getByText("$19.20", { exact: true })).toBeVisible();
  await drawer(page)
    .getByRole("button", {
      name: "Increase Daybreak 250 g subscription every 4 weeks",
      exact: true,
    })
    .click();
  await expect(quantity(page)).toHaveText("3");
  await expect(
    drawer(page).getByText("Free demo shipping unlocked", { exact: true }),
  ).toBeVisible();
  await expect(drawer(page).locator(".total-row dd")).toHaveText("$61.20");
  await drawer(page)
    .getByRole("button", { name: /^Add the scoop/ })
    .click();
  await expect(
    drawer(page).getByRole("heading", { name: "Measuring scoop", exact: true }),
  ).toBeVisible();
  await expect(
    drawer(page).getByText("Stainless steel · One-time purchase", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(drawer(page).locator(".total-row dd")).toHaveText("$69.20");
  await expect(drawer(page).locator(".renewal-note")).toContainText(
    "$8.00 in one-time items",
  );
  if ((page.viewportSize()?.width ?? 1440) <= 700) {
    await page.screenshot({
      path: `test-results/review-${testInfo.project.name}-cart.png`,
    });
  }
  await drawer(page)
    .getByRole("button", {
      name: "Remove Measuring scoop Stainless steel one-time",
      exact: true,
    })
    .click();
  await expect(
    drawer(page).getByRole("heading", { name: "Measuring scoop", exact: true }),
  ).toHaveCount(0);
  await drawer(page)
    .getByRole("button", {
      name: "Remove Daybreak 250 g subscription every 4 weeks",
      exact: true,
    })
    .click();
  await expect(
    drawer(page).getByRole("heading", { name: "A fresh start." }),
  ).toBeVisible();
  await expect(
    drawer(page).getByText("Demo total", { exact: true }),
  ).toHaveCount(0);
});

test("upsell dismissal persists across drawer opens and reload, and reset clears it", async ({
  page,
}) => {
  await add(page).click();
  await drawer(page)
    .getByRole("button", { name: "Dismiss scoop offer", exact: true })
    .click();
  await expect(
    drawer(page).getByRole("button", { name: /^Add the scoop/ }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await bag(page).click();
  await expect(
    drawer(page).getByRole("button", { name: /^Add the scoop/ }),
  ).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Shopper preview", exact: true }).click();
  await add(page).click();
  await expect(drawer(page)).toBeVisible();
  await expect(
    drawer(page).getByRole("button", { name: /^Add the scoop/ }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Reset demo/ }).click();
  await expect(bag(page)).toHaveText("Your bag 0");
  expect(await newestEvent(page)).toMatchObject({
    name: "demo_reset",
    sequence: 1,
    simulation: true,
    destination: "local-only",
  });
  await add(page).click();
  await expect(
    drawer(page).getByRole("button", { name: /^Add the scoop/ }),
  ).toBeVisible();
});

test("a failed quantity request leaves the existing cart unchanged and a retry succeeds", async ({
  page,
}) => {
  await add(page).click();
  await expect(quantity(page)).toHaveText("1");
  await page.keyboard.press("Escape");
  await page
    .getByRole("checkbox", { name: /Fail the next cart request/ })
    .check();
  await bag(page).click();
  await drawer(page)
    .getByRole("button", {
      name: "Increase Daybreak 250 g one-time",
      exact: true,
    })
    .click();
  await expect(drawer(page).getByRole("alert")).toContainText(
    "Your cart is unchanged. Try again.",
  );
  await expect(quantity(page)).toHaveText("1");
  await expect(drawer(page).getByText("$29.00", { exact: true })).toBeVisible();
  expect(await newestEvent(page)).toMatchObject({
    name: "request_failed",
    payload: { operation: "quantity" },
  });
  await drawer(page)
    .getByRole("button", {
      name: "Increase Daybreak 250 g one-time",
      exact: true,
    })
    .click();
  await expect(quantity(page)).toHaveText("2");
  await expect(drawer(page).getByRole("alert")).toHaveCount(0);
  await expect(drawer(page).getByText("$53.00", { exact: true })).toBeVisible();
});

test("rapid clicks during latency add once; busy controls and event payloads agree", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: /Simulate 1.2s latency/ }).check();
  // Synchronous DOM clicks stress the operation lock before React can repaint disabled controls.
  await add(page).evaluate((button) => {
    for (let click = 0; click < 6; click += 1)
      (button as HTMLButtonElement).click();
  });
  await expect(
    page.getByRole("button", { name: /^Updating demo bag/ }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: /Reset demo/ })).toBeDisabled();
  await expect(quantity(page)).toHaveText("1");
  const eventTexts = await page
    .locator(".event-list details pre")
    .allTextContents();
  const events = eventTexts.map((value) => JSON.parse(value));
  expect(events.filter((event) => event.name === "add_to_cart")).toHaveLength(
    1,
  );
  expect(await newestEvent(page)).toMatchObject({
    name: "add_to_cart",
    simulation: true,
    destination: "local-only",
    payload: {
      operation: "add",
      item_count: 1,
      value_cents: 2400,
      experiment: "proposed",
    },
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("checkbox", { name: /Simulate 1.2s latency/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Reset demo/ }).click();
  await expect(bag(page)).toHaveText("Your bag 0");
  await expect(
    page.getByRole("checkbox", { name: /Simulate 1.2s latency/ }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("radio", { name: /One-time purchase/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: /Proposed design/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("native dialog traps keyboard focus, Escape closes, and focus returns to its trigger", async ({
  page,
}) => {
  await bag(page).focus();
  await page.keyboard.press("Enter");
  await expect(drawer(page)).toBeVisible();
  await expect(
    drawer(page).getByRole("button", { name: "Close bag", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    drawer(page).getByRole("button", { name: "Explore Daybreak", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    drawer(page).getByRole("button", { name: "Close bag", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer(page)).not.toBeVisible();
  await expect(bag(page)).toBeFocused();
});

test("mobile sticky purchase action works with the keyboard and preserves selected price", async ({
  page,
}) => {
  test.skip(
    (page.viewportSize()?.width ?? 1440) > 700,
    "Sticky purchase action is intentionally mobile-only.",
  );
  // Let initial layout and IntersectionObserver callbacks settle before asserting.
  await page.evaluate(
    () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }),
  );
  const sticky = page.getByTestId("sticky-atc");
  await expect(sticky).not.toBeVisible();
  await page.getByRole("radio", { name: /Subscribe & save 15%/ }).check();
  await page
    .getByLabel("Delivery frequency", { exact: true })
    .selectOption("2");
  await page.locator("#inspector").scrollIntoViewIfNeeded();
  await expect(sticky).toBeVisible();
  await expect(sticky).toContainText("$20.40 every 2 weeks");
  await page
    .getByRole("checkbox", { name: /Fail the next cart request/ })
    .check();
  await sticky.getByRole("button", { name: /Add to bag/ }).focus();
  await page.keyboard.press("Enter");
  await expect(drawer(page).getByRole("alert")).toContainText(
    "Your cart is unchanged. Try again.",
  );
  await expect(
    drawer(page).getByRole("heading", { name: "A fresh start." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    sticky.getByRole("button", { name: /Add to bag/ }),
  ).toBeFocused();
  await sticky.getByRole("button", { name: /Add to bag/ }).focus();
  await page.keyboard.press("Enter");
  await expect(drawer(page)).toBeVisible();
  await expect(
    drawer(page).getByText("250 g · Every 2 weeks", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    sticky.getByRole("button", { name: /Add to bag/ }),
  ).toBeFocused();
});

test("reduced motion disables animated scrolling and the purchase flow remains usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await add(page).click();
  await expect(quantity(page)).toHaveText("1");
  await expect(
    drawer(page).getByText("Demo only — no checkout", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer(page)).not.toBeVisible();
});


test("merchant guidance is the default and lesson navigation works without developer details", async ({ page }) => {
  await page.reload();
  await expect(page.locator("#developer-details")).not.toHaveAttribute("open", "");
  await expect(page.getByRole("heading", { name: "A clearer page starts with a shopper’s question." })).toBeVisible();
  const lessons = page.getByRole("navigation", { name: "Improvement lessons" });
  await expect(lessons.getByRole("button")).toHaveCount(7);
  const expertise = lessons.getByRole("button", { name: /Show how you make decisions/ });
  await expertise.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#lesson-title")).toHaveText("Show how you make decisions");
  await expect(page.locator("#lesson-title")).toBeFocused();
  await page.getByRole("button", { name: "Possible improvement", exact: true }).click();
  await expect(page.locator(".merchant-example-copy")).toContainText("Illustrative process");
  await expect(page.locator(".merchant-example-copy")).toContainText("real merchant would need");
  await page.getByRole("button", { name: "Before", exact: true }).click();
  await expect(page.locator(".merchant-example-copy")).toContainText("Expertly roasted");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test("optional questions and fictional feedback lead to useful explanations and a resettable draft plan", async ({ page }) => {
  await page.getByRole("button", { name: "Merchant guide", exact: true }).click();
  const lessons = page.getByRole("navigation", { name: "Improvement lessons" });
  await lessons.getByRole("button", { name: /Let shoppers explore their question/ }).click();
  await page.getByRole("button", { name: "Possible improvement", exact: true }).click();
  await page.getByRole("button", { name: "How is it developed?", exact: true }).click();
  await expect(page.locator("#merchant-answer")).toContainText("roast logs and tasting records");
  await page.getByRole("button", { name: "Will it fit my routine?", exact: true }).click();
  await expect(page.locator("#merchant-answer")).toContainText("does not select a subscription");
  await page.getByRole("button", { name: "Shopper preview", exact: true }).click();
  await expect(bag(page)).toHaveText("Your bag 0");
  await expect(page.getByRole("radio", { name: /One-time purchase/ })).toBeChecked();
  await page.getByRole("button", { name: "Merchant guide", exact: true }).click();
  await lessons.getByRole("button", { name: /customer|feedback|reviews/i }).click();
  await page.getByRole("button", { name: "Possible improvement", exact: true }).click();
  await expect(page.locator(".merchant-review-exercise")).toContainText("NOT A CUSTOMER TESTIMONIAL");
  await page.getByRole("button", { name: "Worry", exact: true }).click();
  await expect(page.locator(".merchant-review-exercise .merchant-answer")).toContainText("One practice note proves nothing");
  await page.getByRole("link", { name: "Use this in my draft plan ↓", exact: true }).click();
  await expect(page.getByLabel("Choose your first improvement")).toHaveValue("reviews");
  await page.getByRole("checkbox", { name: "I have reviewed real evidence for this change.", exact: true }).check();
  await page.getByRole("checkbox", { name: "I have checked the claims, limits and keyboard/mobile experience.", exact: true }).check();
  await page.getByRole("button", { name: "Select plan text to copy", exact: true }).click();
  await expect(page.getByLabel("Your draft plan")).toBeFocused();
  await expect(page.locator(".merchant-plan-notice")).toContainText("Plan text selected");
  await page.getByRole("button", { name: /Reset demo/ }).click();
  await expect(page.getByLabel("Choose your first improvement")).toHaveValue("price");
  await expect(page.getByRole("checkbox", { name: "I have reviewed real evidence for this change.", exact: true })).not.toBeChecked();
  await expect(page.locator("#lesson-title")).toHaveText("Explain the price");
  expect(await newestEvent(page)).toMatchObject({ name: "demo_reset", sequence: 1, simulation: true, destination: "local-only" });
});

test("price assumptions and routine comparison are transparent, optional and applied only on request", async ({ page }) => {
  await page.getByRole("button", { name: "See cost assumptions and compare your routine", exact: true }).click();
  const guidance = page.locator(".buyer-guidance");
  await expect(guidance).toContainText("$1.85 per complete cup");
  await expect(guidance).toContainText("13 complete cups, with 16 g left");
  await page.getByLabel("Coffee per cup (grams)", { exact: true }).selectOption("15");
  await expect(guidance).toContainText("$1.50 per complete cup");
  await expect(guidance).toContainText("Excludes shipping, tax, equipment and waste");
  await page.getByRole("radio", { name: /Subscribe & save 15%/ }).check();
  await page.getByLabel("Delivery frequency", { exact: true }).selectOption("6");
  await expect(guidance).toContainText("$1.28 per complete cup");
  await page.getByRole("button", { name: "Will this bag fit my routine?", exact: true }).click();
  await page.getByLabel("Cups per day", { exact: true }).selectOption("2");
  await page.getByLabel("Compare a bag", { exact: true }).selectOption("daybreak-500");
  await expect(page.locator("#routine-helper")).toContainText("500 g makes 33 complete cups: about 16.5 days");
  await expect(page.locator(".price-line > strong")).toHaveText("$20.40");
  await expect(bag(page)).toHaveText("Your bag 0");
  await page.getByRole("button", { name: "Use this bag size", exact: true }).click();
  await expect(page.getByRole("button", { name: "500 g", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: /Subscribe & save 15%/ })).toBeChecked();
  await expect(page.getByLabel("Delivery frequency", { exact: true })).toHaveValue("6");
  await expect(page.locator(".price-line > strong")).toHaveText("$35.70");
  await expect(bag(page)).toHaveText("Your bag 0");
  expect(await newestEvent(page)).toMatchObject({ name: "routine_selection_applied", simulation: true, destination: "local-only", payload: { item_id: "daybreak-500", cups_per_day: 2, dose_grams: 15 } });
  await page.getByRole("button", { name: "Baseline", exact: true }).click();
  await expect(guidance).toHaveCount(0);
  await expect(page.locator(".price-line > strong")).toHaveText("$35.70");
  await page.getByRole("button", { name: /Proposed design/ }).click();
  await expect(page.getByLabel("Coffee per cup (grams)", { exact: true })).toHaveValue("15");
  await page.getByRole("button", { name: /Reset demo/ }).click();
  await expect(page.locator("#buyer-guidance")).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "See cost assumptions and compare your routine", exact: true }).click();
  await expect(page.getByLabel("Coffee per cup (grams)", { exact: true })).toHaveValue("18");
  await expect(page.getByRole("button", { name: "Will this bag fit my routine?", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("radio", { name: /One-time purchase/ })).toBeChecked();
  await expect(page.locator(".price-line > strong")).toHaveText("$24.00");
  await page.getByRole("button", { name: "Will this bag fit my routine?", exact: true }).click();
  await expect(page.getByLabel("Cups per day", { exact: true })).toHaveValue("1");
  await expect(page.getByLabel("Compare a bag", { exact: true })).toHaveValue("daybreak-250");
});


test("ritual upsell changes only size and guide-preview switches preserve shopping choices", async ({ page }) => {
  const ritual = page.getByRole("region", { name: "Complete your ritual", exact: true });
  await expect(ritual).toBeVisible();
  await expect(page.getByRole("radio", { name: /One-time purchase/ })).toBeChecked();
  await page.getByRole("radio", { name: /Subscribe & save 15%/ }).check();
  await page.getByLabel("Delivery frequency", { exact: true }).selectOption("6");
  await ritual.getByRole("button", { name: "Choose 500 g instead", exact: true }).click();
  await expect(page.getByRole("button", { name: "500 g", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: /Subscribe & save 15%/ })).toBeChecked();
  await expect(page.getByLabel("Delivery frequency", { exact: true })).toHaveValue("6");
  await expect(page.locator(".price-line > strong")).toHaveText("$35.70");
  await expect(bag(page)).toHaveText("Your bag 0");
  await add(page).click();
  await expect(drawer(page).getByText("500 g · Every 6 weeks", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Merchant guide", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Daybreak blend", exact: true })).not.toBeVisible();
  await expect(page.locator("#lesson-title")).toBeVisible();
  await page.getByRole("button", { name: "Shopper preview", exact: true }).click();
  await expect(page.locator("#lesson-title")).not.toBeVisible();
  await expect(page.getByLabel("Delivery frequency", { exact: true })).toHaveValue("6");
  await expect(page.locator(".price-line > strong")).toHaveText("$35.70");
  await expect(bag(page)).toHaveText("Your bag 1");
  await page.getByText("Will extras be added automatically?", { exact: true }).click();
  await expect(page.getByText("No. A larger coffee bag or an optional measuring scoop needs your explicit choice.", { exact: false })).toBeVisible();
});

test("embedded scoop stays one-time, cannot duplicate and shares dismissal with cart", async ({ page }) => {
  const ritual = page.getByRole("region", { name: "Complete your ritual", exact: true });
  await page.getByRole("checkbox", { name: /Fail the next cart request/ }).check();
  await ritual.getByRole("button", { name: "Add scoop to demo bag", exact: true }).click();
  await expect(drawer(page).getByRole("alert")).toContainText("Your cart is unchanged. Try again.");
  await expect(drawer(page).getByRole("heading", { name: "A fresh start." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bag(page)).toHaveText("Your bag 0");
  await ritual.getByRole("button", { name: "Add scoop to demo bag", exact: true }).click();
  await expect(drawer(page)).toBeVisible();
  await expect(drawer(page).getByText("Stainless steel · One-time purchase", { exact: true })).toBeVisible();
  await expect(drawer(page).getByRole("heading", { name: "Daybreak", exact: true })).toHaveCount(0);
  await expect(drawer(page).getByRole("button", { name: /^Add the scoop/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(add(page)).toBeFocused();
  await expect(ritual.getByRole("button", { name: "Add scoop to demo bag", exact: true })).toHaveCount(0);
  await expect(ritual).toContainText("Already in your bag");
  await expect(page.getByRole("radio", { name: /One-time purchase/ })).toBeChecked();
  await bag(page).click();
  await drawer(page).getByRole("button", { name: "Remove Measuring scoop Stainless steel one-time", exact: true }).click();
  await expect(drawer(page).getByRole("heading", { name: "A fresh start." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(ritual.getByRole("button", { name: "Add scoop to demo bag", exact: true })).toBeVisible();
  await ritual.getByRole("button", { name: "Hide scoop recommendation", exact: true }).click();
  await expect(ritual).toContainText("Offer hidden by you");
  await add(page).click();
  await expect(drawer(page).getByRole("button", { name: /^Add the scoop/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Reset demo/ }).click();
  await expect(ritual.getByRole("button", { name: "Add scoop to demo bag", exact: true })).toBeVisible();
  await expect(bag(page)).toHaveText("Your bag 0");
  await add(page).click();
  await expect(drawer(page).getByRole("button", { name: /^Add the scoop/ })).toBeVisible();
});


test("guide preview links and empty-cart exploration focus the visible shopper experience", async ({ page }) => {
  await page.getByRole("button", { name: "Merchant guide", exact: true }).click();
  await page.getByRole("button", { name: "Or explore the coffee shop →", exact: true }).click();
  await expect(page.locator("#product-title")).toBeFocused();
  await page.getByRole("button", { name: "Merchant guide", exact: true }).click();
  await expect(page.locator("#lab-title")).toBeFocused();
  const evidence = page.locator("#evidence");
  await evidence.getByRole("button", { name: /Try/ }).nth(1).click();
  await expect(drawer(page)).toBeVisible();
  await drawer(page).getByRole("button", { name: "Explore Daybreak", exact: true }).click();
  await expect(drawer(page)).not.toBeVisible();
  await expect(page.locator("#product-title")).toBeFocused();
});
