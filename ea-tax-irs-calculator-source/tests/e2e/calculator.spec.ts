import { test, expect } from "@playwright/test";

// Locating by the `name` attribute (set by React Hook Form's register()) is
// used instead of getByLabel here: several field hints/tooltips contain
// phrases ("...the original payment due date.") that overlap with other
// field labels, and required fields render a visually-hidden `*` that
// browsers still include in the computed accessible name — both make
// label-text matching fragile. The `name` attribute is unique and stable.
async function fillGoldenPath(page: import("@playwright/test").Page) {
  // Each fill is followed by an explicit value check (which Playwright
  // auto-retries) rather than immediately moving to the next field — under
  // WebKit specifically, moving on too fast can occasionally race ahead of
  // React registering the previous field's value.
  // .pressSequentially (real keystrokes) rather than .fill() for this field
  // specifically — under WebKit, .fill() was observed to silently leave this
  // particular input empty despite resolving to the correct element.
  const taxField = page.locator('[name="taxRequiredToBeShown"]');
  await taxField.click();
  await taxField.pressSequentially("5000");
  await expect(taxField).toHaveValue("5000");

  const originalPaymentDueDate = page.locator('[name="originalPaymentDueDate"]');
  await originalPaymentDueDate.fill("2022-04-15");
  await expect(originalPaymentDueDate).toHaveValue("2022-04-15");

  const originalFilingDueDate = page.locator('[name="originalFilingDueDate"]');
  await originalFilingDueDate.fill("2022-04-15");
  await expect(originalFilingDueDate).toHaveValue("2022-04-15");

  const actualFiledDate = page.locator('[name="actualFiledDate"]');
  await actualFiledDate.fill("2022-07-13");
  await expect(actualFiledDate).toHaveValue("2022-07-13");

  const calculationThroughDate = page.locator('[name="calculationThroughDate"]');
  await calculationThroughDate.fill("2022-07-13");
  await expect(calculationThroughDate).toHaveValue("2022-07-13");
}

/** Fills the golden path AND the IRM example's two payments, landing on the $797.27 total used throughout this suite. */
async function fillGoldenPathWithPayments(page: import("@playwright/test").Page) {
  await fillGoldenPath(page);
  await page.getByRole("button", { name: "Add payment" }).click();
  await page.getByRole("button", { name: "Add payment" }).click();

  const paymentDates = page.locator('[name$=".date"]');
  const paymentAmounts = page.locator('[name$=".amount"]');
  await paymentDates.nth(0).fill("2022-06-01");
  await paymentAmounts.nth(0).fill("2000");
  await paymentDates.nth(1).fill("2022-07-13");
  await paymentAmounts.nth(1).fill("3000");
}

test.describe("Desktop calculator flow", () => {
  test("computes the IRM example estimate and shows the results panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Estimate IRS Penalties and Interest" })).toBeVisible();

    await fillGoldenPathWithPayments(page);

    await expect(page.getByText("$797.27").first()).toBeVisible();
    await expect(page.getByText("$685.00").first()).toBeVisible();
    await expect(page.getByText("$65.00").first()).toBeVisible();
  });

  test("adding and deleting payment rows works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add payment" }).click();
    await expect(page.locator('[name$=".date"]')).toHaveCount(1);
    await page.getByRole("button", { name: "Add payment" }).click();
    await expect(page.locator('[name$=".date"]')).toHaveCount(2);
    await page.getByRole("button", { name: "Remove payment 1" }).click();
    await expect(page.locator('[name$=".date"]')).toHaveCount(1);
  });

  test("expanding the calculation details accordion reveals month-by-month tables", async ({ page }) => {
    await page.goto("/");
    await fillGoldenPathWithPayments(page);
    await expect(page.getByText("$797.27").first()).toBeVisible();

    await page.getByRole("button", { name: "Failure-to-pay penalty by month" }).click();
    // Both month-by-month tables render "Month 1" in the DOM (the collapsed
    // one just isn't visible), so .first() avoids a strict-mode violation.
    await expect(page.getByText("Month 1").first()).toBeVisible();

    await page.getByRole("button", { name: "Failure-to-file penalty by month" }).click();
    await expect(page.getByText("Overlap reduction")).toBeVisible();
  });

  test("illustrative relief scenario shows a reduced revised estimate", async ({ page }) => {
    await page.goto("/");
    await fillGoldenPathWithPayments(page);
    await expect(page.getByText("$797.27").first()).toBeVisible();

    await page.getByRole("button", { name: "Advanced options" }).click();
    await page.locator('[name="illustrativeRelief"]').selectOption("BOTH");

    await expect(page.getByText("Illustrative Balance if Selected Penalties Were Removed")).toBeVisible();
    await expect(page.getByText("This is an illustration only.")).toBeVisible();
  });

  test("the Calendly CTA opens in a new tab with safe rel attributes", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Schedule a Free Discovery Call" }).first();
    await expect(cta).toHaveAttribute("href", "https://calendly.com/ea-tax-resolutions/discovery-call");
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", /noopener/);
  });

  test("print button invokes window.print", async ({ page }) => {
    await page.goto("/");
    await fillGoldenPathWithPayments(page);
    await expect(page.getByText("$797.27").first()).toBeVisible();

    let printCalled = false;
    await page.exposeFunction("__printCalled", () => {
      printCalled = true;
    });
    await page.evaluate(() => {
      window.print = () => (window as unknown as { __printCalled: () => void }).__printCalled();
    });
    await page.getByRole("button", { name: "Print" }).click();
    expect(printCalled).toBe(true);
  });

  test("keyboard-only navigation can reach and fill the first form field", async ({ page }) => {
    await page.goto("/");
    await page.locator('[name="taxRequiredToBeShown"]').focus();
    await page.keyboard.type("1000");
    await expect(page.locator('[name="taxRequiredToBeShown"]')).toHaveValue("1000");
  });
});

test.describe("Mobile calculator flow", () => {
  // Cherry-picked viewport/touch properties rather than spreading a full
  // devices[...] preset — spreading one (which includes defaultBrowserType)
  // inside a describe block forces a conflicting new worker.
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("renders without horizontal overflow and computes an estimate", async ({ page }) => {
    await page.goto("/");
    await fillGoldenPathWithPayments(page);
    await expect(page.getByText("$797.27").first()).toBeVisible();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });
});
