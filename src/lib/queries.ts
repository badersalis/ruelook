import { supabase } from "@/lib/supabase/client";
import type { CategorySlug, Look, ProductDetail, ProductSummary } from "@/lib/types";

const SUMMARY =
  "id, slug, name, price_cents, created_at, categories!inner(slug, name), product_images(path, alt, sort), product_variants(stock)";

type Row = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  created_at: string;
  categories: { slug: string; name: string };
  product_images: { path: string; alt: string; sort: number }[];
  product_variants: { stock: number }[];
};

export function toSummary(r: Row): ProductSummary {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    price_cents: r.price_cents,
    created_at: r.created_at,
    category: { slug: r.categories.slug as CategorySlug, name: r.categories.name },
    images: [...(r.product_images ?? [])].sort((a, b) => a.sort - b.sort),
    totalStock: (r.product_variants ?? []).reduce((n, v) => n + v.stock, 0),
  };
}

export type SortKey = "newest" | "price_asc" | "price_desc";
export const PAGE_SIZE = 24;

export interface ListParams {
  category?: CategorySlug | null;
  sort?: SortKey;
  q?: string;
  page?: number;
  limit?: number;
  excludeId?: string;
}

export async function listProducts(p: ListParams = {}): Promise<{ items: ProductSummary[]; total: number }> {
  const limit = p.limit ?? PAGE_SIZE;
  const from = (p.page ?? 0) * limit;
  let q = supabase.from("products").select(SUMMARY, { count: "exact" }).eq("status", "published");
  if (p.category) q = q.eq("categories.slug", p.category);
  if (p.q && p.q.trim().length >= 2) q = q.ilike("name", `%${p.q.trim().replace(/[%_,()]/g, "")}%`);
  if (p.excludeId) q = q.neq("id", p.excludeId);
  const sort = p.sort ?? "newest";
  q =
    sort === "price_asc"
      ? q.order("price_cents", { ascending: true })
      : sort === "price_desc"
        ? q.order("price_cents", { ascending: false })
        : q.order("created_at", { ascending: false });
  const { data, error, count } = await q.order("id").range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data as unknown as Row[]).map(toSummary), total: count ?? 0 };
}

export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("products").select(SUMMARY).in("id", ids).eq("status", "published");
  if (error) throw error;
  const byId = new Map((data as unknown as Row[]).map((r) => [r.id, toSummary(r)]));
  return ids.map((id) => byId.get(id)).filter((x): x is ProductSummary => !!x);
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, price_cents, created_at, description, material_care, drop_label, categories!inner(slug, name), product_images(path, alt, sort), product_variants(id, size, stock, color_id), product_colors(id, name, hex, sort)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as unknown as Row & {
    description: string;
    material_care: string;
    drop_label: string | null;
    product_variants: { id: string; size: string; stock: number; color_id: string | null }[];
    product_colors: { id: string; name: string; hex: string; sort: number }[];
  };
  return {
    ...toSummary(r),
    description: r.description,
    material_care: r.material_care,
    drop_label: r.drop_label,
    colors: [...r.product_colors].sort((a, b) => a.sort - b.sort).map(({ id, name, hex }) => ({ id, name, hex })),
    variants: sortSizes(r.product_variants),
  };
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "S/M", "L/XL"];
export function sortSizes<T extends { size: string }>(v: T[]): T[] {
  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s);
    if (i >= 0) return i;
    const n = parseFloat(s);
    return Number.isNaN(n) ? 999 : 100 + n;
  };
  return [...v].sort((a, b) => rank(a.size) - rank(b.size));
}

export async function getLooks(productId: string): Promise<Look[]> {
  const { data, error } = await supabase
    .from("ai_looks")
    .select("look_index, title, rationale, item_product_ids")
    .eq("product_id", productId)
    .order("look_index");
  if (error) throw error;
  if (!data?.length) return [];
  const ids = [...new Set(data.flatMap((l) => l.item_product_ids))];
  const products = await getProductsByIds(ids);
  const byId = new Map(products.map((p) => [p.id, p]));
  return data
    .map((l) => ({
      index: l.look_index,
      title: l.title,
      rationale: l.rationale,
      items: l.item_product_ids.map((id) => byId.get(id)).filter((x): x is ProductSummary => !!x),
    }))
    .filter((l) => l.items.length >= 2);
}
