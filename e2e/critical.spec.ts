import { expect, test } from "@playwright/test";

// Critical journeys (AC-1..AC-6, AC-9, AC-10 UI side). Orders placed here use fictional data.

test("home shows hero, new arrivals and switches tabs", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("The street is").first()).toBeVisible();
  const panel = page.locator("#new-arrivals-panel");
  await expect(panel.locator("article").first()).toBeVisible();
  await page.getByRole("tab", { name: "Shoes" }).click();
  await expect(page.getByRole("tab", { name: "Shoes" })).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByRole("link", { name: /Boot|Sneaker/ }).first()).toBeVisible();
});

test("shop filters by category, sorts and searches", async ({ page }) => {
  await page.goto("shop/?category=men&sort=price_asc");
  await expect(page.getByText("8 pieces").first()).toBeVisible();
  const prices = await page.locator("article .tnum").allTextContents();
  const nums = prices.map((p) => Number(p.replace(/[^0-9.]/g, "")));
  expect(nums).toEqual([...nums].sort((a, b) => a - b));
  await page.goto("shop/?q=chelsea");
  await expect(page.getByText("2 pieces").first()).toBeVisible();
  await page.goto("shop/?q=zzzznotathing");
  await expect(page.getByText("No pieces match").first()).toBeVisible();
});

test("PDP requires a size, then adds to bag and persists", async ({ page }) => {
  await page.goto("product/?slug=crew-tee-navy");
  await expect(page.getByRole("heading", { level: 1, name: "Essential Crew Tee" })).toBeVisible();
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  await expect(page.getByText("Select a size")).toBeVisible();
  await page.locator('label:has(input[name="size"][value="M"])').click();
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  const drawer = page.getByRole("dialog", { name: "Your bag" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Essential Crew Tee" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Bag, 1 item/ })).toBeVisible();
});

test("sold-out product cannot be added", async ({ page }) => {
  await page.goto("product/?slug=blank-cap-white");
  await expect(page.getByRole("button", { name: "Sold out" })).toBeDisabled();
});

test("checkout validates, places an order request and shows confirmation", async ({ page }) => {
  await page.goto("product/?slug=kraft-tote");
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  await page.goto("checkout/");
  await page.getByRole("button", { name: "Place order request" }).click();
  await expect(page.getByText(/Please fix/)).toBeVisible();
  await page.fill("#f-email", `e2e.${Date.now()}.${test.info().project.name}@example.com`);
  await page.fill("#f-phone", "+233 20 000 0000");
  await page.fill("#f-full_name", "E2E Test Shopper");
  await page.fill("#f-city", "Accra");
  await page.fill("#f-address", "1 Example Street");
  await page.getByRole("button", { name: "Place order request" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/order=RL-/);
  await expect(page.getByText(/Coated Kraft Tote/).first()).toBeVisible();
});

test("protected pages send guests to sign in", async ({ page }) => {
  await page.goto("admin/");
  await expect(page).toHaveURL(/account\/login\/\?next=/);
  await page.goto("wishlist/");
  await expect(page).toHaveURL(/account\/login/);
});

test("wishlist heart asks guests to sign in", async ({ page }) => {
  await page.goto("product/?slug=chelsea-boot-black");
  await page.getByRole("button", { name: "Save to wishlist" }).click();
  await expect(page).toHaveURL(/reason=wishlist/);
  await expect(page.getByText("Sign in to save pieces")).toBeVisible();
});

test("unknown product shows the not-found state", async ({ page }) => {
  await page.goto("product/?slug=does-not-exist");
  await expect(page.getByText("This piece has left the building")).toBeVisible();
});

test("keyboard: skip link and visible focus", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard journey is desktop-only");
  await page.goto("./");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle + getComputedStyle(el).boxShadow);
  expect(outline).not.toBe("nonenone");
});

test("reduced motion: hero does not autoplay", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(test.info().project.use.baseURL!);
  await expect(page.getByRole("button", { name: /^Play/ })).toBeVisible();
  await ctx.close();
});
