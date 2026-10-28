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
  await expect(
    page.getByRole("heading", { name: "Daybreak blend" }),
  ).toBeVisible();
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
