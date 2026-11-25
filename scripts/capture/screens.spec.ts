import { expect, test, type Page } from "@playwright/test";

// Captures every key screen and state to docs/design/screens/<viewport>/NN-name.png.
// Read-only against the demo backend: no orders are placed.
const shot = async (page: Page, name: string, fullPage = true) => {
  await page.waitForLoadState("networkidle");
  // Lazy images only load once scrolled into view: walk the page, then wait (capped) for pending images.
  await page.evaluate(async (full) => {
    await document.fonts.ready;
    if (full) {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    }
    const pending = [...document.images].filter((i) => !i.complete);
    await Promise.race([
      Promise.all(pending.map((i) => new Promise((r) => { i.addEventListener("load", r); i.addEventListener("error", r); }))),
      new Promise((r) => setTimeout(r, 5000)),
    ]);
  }, fullPage);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/design/screens/${test.info().project.name}/${name}.png`, fullPage });
};

const addCrewTee = async (page: Page) => {
  await page.goto("product/?slug=crew-tee-navy");
  await page.locator('label:has(input[name="size"][value="M"])').click();
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  await expect(page.getByRole("dialog", { name: "Your bag" })).toBeVisible();
};

test("01 home", async ({ page }) => {
  await page.goto("./?capture=1");
  await expect(page.getByText("The street is").first()).toBeVisible();
  await shot(page, "01-home");
});

test("02-04 shop states", async ({ page }) => {
  await page.goto("shop/");
  await expect(page.locator("article").first()).toBeVisible();
  await shot(page, "02-shop");
  await page.goto("shop/?category=men&sort=price_asc");
  await expect(page.getByText("8 pieces").first()).toBeVisible();
  await shot(page, "03-shop-filtered");
  await page.goto("shop/?q=zzzznotathing");
  await expect(page.getByText("No pieces match").first()).toBeVisible();
  await shot(page, "04-shop-empty");
});

test("05-07 product page states", async ({ page }) => {
  await page.goto("product/?slug=crew-tee-navy");
  await expect(page.getByRole("heading", { level: 1, name: "Essential Crew Tee" })).toBeVisible();
  await shot(page, "05-product");
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  await expect(page.getByText("Select a size")).toBeVisible();
  await shot(page, "06-product-size-error", false);
  await page.goto("product/?slug=blank-cap-white");
  await expect(page.getByRole("button", { name: "Sold out" })).toBeDisabled();
  await shot(page, "07-product-sold-out", false);
});

test("08-10 bag states", async ({ page }) => {
  await page.goto("bag/");
  await page.waitForLoadState("networkidle");
  await shot(page, "08-bag-empty");
  await addCrewTee(page);
  await shot(page, "09-bag-drawer", false);
  await page.goto("bag/");
  await expect(page.getByRole("link", { name: "Essential Crew Tee" }).first()).toBeVisible();
  await shot(page, "10-bag");
});

test("11-12 checkout states", async ({ page }) => {
  await addCrewTee(page);
  await page.goto("checkout/");
  await expect(page.getByRole("button", { name: "Place order request" })).toBeVisible();
  await shot(page, "11-checkout");
  await page.getByRole("button", { name: "Place order request" }).click();
  await expect(page.getByText(/Please fix/)).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "12-checkout-errors");
});

test("13-15 auth", async ({ page }) => {
  await page.goto("account/login/");
  await page.waitForLoadState("networkidle");
  await shot(page, "13-sign-in");
  await page.goto("product/?slug=chelsea-boot-black");
  await page.getByRole("button", { name: "Save to wishlist" }).click();
  await expect(page.getByText("Sign in to save pieces")).toBeVisible();
  await shot(page, "14-sign-in-wishlist-prompt");
  await page.goto("account/signup/");
  await page.waitForLoadState("networkidle");
  await shot(page, "15-sign-up");
});

test("16 not found", async ({ page }) => {
  await page.goto("product/?slug=does-not-exist");
  await expect(page.getByText("This piece has left the building")).toBeVisible();
  await shot(page, "16-not-found");
});

test("17 search overlay", async ({ page }) => {
  await page.goto("shop/");
  await page.getByRole("button", { name: "Search" }).first().click();
  await page.waitForTimeout(400);
  await shot(page, "17-search", false);
});

test("18 mobile menu", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mobile only");
  await page.goto("./?capture=1");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(400);
  await shot(page, "18-menu", false);
});
