import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import type { Tables } from "@/lib/supabase/database.types";

export type AdminProduct = Tables<"products"> & {
  categories: { slug: string; name: string } | null;
  product_images: Tables<"product_images">[];
  product_colors: Tables<"product_colors">[];
  product_variants: Tables<"product_variants">[];
};

const ADMIN_SELECT = "*, categories(slug,name), product_images(*), product_colors(*), product_variants(*)";

export async function adminListProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from("products").select(ADMIN_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as AdminProduct[];
}

export async function adminGetProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase.from("products").select(ADMIN_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = data as unknown as AdminProduct;
  p.product_images.sort((a, b) => a.sort - b.sort);
  return p;
}

export async function listCategories() {
  const { data, error } = await supabase.from("categories").select("id, slug, name").order("sort");
  if (error) throw error;
  return data;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only").max(80),
  category_id: z.coerce.number().int().positive("Choose a category"),
  description: z.string().trim().max(2000),
  material_care: z.string().trim().max(1000),
  price: z.coerce.number().positive("Price must be above 0").max(100000),
  status: z.enum(["draft", "published", "archived"]),
  color_name: z.string().trim().min(1, "Colour name is required").max(40),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #1F4FB0"),
  variants: z
    .array(z.object({ id: z.string().optional(), size: z.string().trim().min(1, "Size required").max(20), stock: z.coerce.number().int().min(0).max(9999) }))
    .min(1, "Add at least one size"),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function checkImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${file.name}: use JPG, PNG or WebP.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: images must be 5 MB or smaller.`;
  return null;
}

export async function uploadProductImage(productId: string, file: File, sort: number, alt: string) {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from(config.storageBucket).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw up.error;
  const { error } = await supabase.from("product_images").insert({ product_id: productId, path, alt, sort });
  if (error) throw error;
}
