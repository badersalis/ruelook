import { describe, expect, it } from "vitest";
import { cartCount, cartSubtotal, clampQty, mergeLines, MAX_QTY, type CartLine } from "@/lib/cart/store";
import { validateLooks } from "@/lib/ai/stylist";
import { formatPrice } from "@/lib/money";
import { sortSizes } from "@/lib/queries";
import { checkoutErrorMessage, checkoutSchema } from "@/lib/checkout";
import { checkImageFile, productFormSchema, slugify } from "@/lib/admin";
import { NEXT_STATUS } from "@/lib/orders";

const line = (variantId: string, qty: number, maxQty = 10, priceCents = 1000): CartLine => ({
  variantId, productId: "p", slug: "s", name: "n", color: null, size: "M", priceCents, imagePath: null, maxQty, qty,
});

describe("cart", () => {
  it("clamps quantity to 1..min(MAX_QTY, stock)", () => {
    expect(clampQty(0, 5)).toBe(1);
    expect(clampQty(7, 5)).toBe(5);
    expect(clampQty(50, 100)).toBe(MAX_QTY);
  });
  it("counts items and subtotals in cents", () => {
    const lines = [line("a", 2, 10, 4500), line("b", 1, 10, 999)];
    expect(cartCount(lines)).toBe(3);
    expect(cartSubtotal(lines)).toBe(9999);
  });
  it("merges guest into server lines, summing duplicates within stock", () => {
    const merged = mergeLines([line("a", 3, 4), line("c", 1)], [line("a", 2, 4), line("b", 1)]);
    expect(merged.find((l) => l.variantId === "a")?.qty).toBe(4);
    expect(merged.map((l) => l.variantId).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("AI stylist validation", () => {
  const ids = new Set(["x1", "x2", "x3"]);
  it("accepts valid looks and strips unknown, duplicate and self ids", () => {
    const out = validateLooks({ looks: [{ title: "Street", rationale: "Pairs well together for the city.", item_ids: ["x1", "x1", "zz", "self", "x2"] }] }, ids, "self");
    expect(typeof out).toBe("object");
    if (typeof out === "object") expect(out.looks[0]!.item_ids).toEqual(["x1", "x2"]);
  });
  it("rejects looks with fewer than 2 whitelisted items", () => {
    expect(typeof validateLooks({ looks: [{ title: "Bad", rationale: "Hallucinated ids only here.", item_ids: ["zz", "yy"] }] }, ids, "self")).toBe("string");
  });
  it("rejects malformed output", () => {
    expect(typeof validateLooks({ nope: true }, ids, "self")).toBe("string");
    expect(typeof validateLooks("not json", ids, "self")).toBe("string");
  });
});

describe("formatting and sizes", () => {
  it("formats USD", () => expect(formatPrice(10800)).toBe("$108.00"));
  it("orders apparel then numeric sizes", () => {
    expect(sortSizes([{ size: "XL" }, { size: "S" }, { size: "M" }]).map((v) => v.size)).toEqual(["S", "M", "XL"]);
    expect(sortSizes([{ size: "42" }, { size: "39" }]).map((v) => v.size)).toEqual(["39", "42"]);
  });
});

describe("checkout", () => {
  const ok = { email: "ama@example.com", phone: "+233 20 000 0000", full_name: "Ama Mensah", country: "Ghana", city: "Accra", address: "12 Example Street" };
  it("accepts a complete form", () => expect(checkoutSchema.safeParse(ok).success).toBe(true));
  it("rejects a bad email and phone", () => {
    const r = checkoutSchema.safeParse({ ...ok, email: "nope", phone: "call me" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(["email", "phone"]);
  });
  it("maps RPC errors to plain language", () => {
    expect(checkoutErrorMessage("not enough stock for variant")).toMatch(/sold out/);
    expect(checkoutErrorMessage("too many orders")).toMatch(/later/);
    expect(checkoutErrorMessage("weird")).toMatch(/couldn't place/i);
  });
});

describe("admin", () => {
  it("slugifies names", () => expect(slugify("Café Hoodie — Black!")).toBe("cafe-hoodie-black"));
  it("validates product forms and coerces numbers", () => {
    const r = productFormSchema.safeParse({ name: "Tee", slug: "tee", category_id: "2", description: "", material_care: "", price: "39.5", status: "draft", color_name: "Black", color_hex: "#000000", variants: [{ size: "M", stock: "3" }] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBe(39.5);
    expect(productFormSchema.safeParse({ name: "Tee", slug: "Bad Slug", category_id: 0, description: "", material_care: "", price: 0, status: "draft", color_name: "", color_hex: "red", variants: [] }).success).toBe(false);
  });
  it("checks image type and size", () => {
    expect(checkImageFile(new File(["x"], "a.gif", { type: "image/gif" }))).toMatch(/JPG/);
    expect(checkImageFile(new File([new Uint8Array(6 * 1024 * 1024)], "b.jpg", { type: "image/jpeg" }))).toMatch(/5 MB/);
    expect(checkImageFile(new File(["x"], "c.webp", { type: "image/webp" }))).toBeNull();
  });
  it("only allows forward order transitions", () => {
    expect(NEXT_STATUS.requested).toEqual(["confirmed", "cancelled"]);
    expect(NEXT_STATUS.completed).toEqual([]);
  });
});

describe("post-login redirect guard", async () => {
  const { safeNext } = await import("@/components/store/AuthForm");
  it("keeps same-site paths", () => expect(safeNext("/product/?slug=x")).toBe("/product/?slug=x"));
  it.each([null, "https://evil.example", "//evil.example", "/\\evil.example", "/\\/evil", "javascript:alert(1)", "/ok\nSet-Cookie"])(
    "rejects %s",
    (v) => expect(safeNext(v)).toBe("/account/"),
  );
});
