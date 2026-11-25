export type CategorySlug = "women" | "men" | "shoes" | "bags" | "accessories";

export const CATEGORIES: { slug: CategorySlug; name: string }[] = [
  { slug: "women", name: "Women" },
  { slug: "men", name: "Men" },
  { slug: "shoes", name: "Shoes" },
  { slug: "bags", name: "Bags" },
  { slug: "accessories", name: "Accessories" },
];

export interface ProductImage {
  path: string;
  alt: string;
  sort: number;
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  color_id: string | null;
}

/** Card-level product (listing, grids, look items). */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  created_at: string;
  category: { slug: CategorySlug; name: string };
  images: ProductImage[];
  totalStock: number;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  material_care: string;
  drop_label: string | null;
  colors: ProductColor[];
  variants: ProductVariant[];
}

export interface Look {
  index: number;
  title: string;
  rationale: string;
  items: ProductSummary[];
}

export interface HeroSlide {
  id: string;
  kicker: string;
  /** Authored lines, never split at runtime (motion spec). */
  lines: string[];
  sub: string;
  cta: { label: string; href: string };
  image: { src960: string; src1600: string; alt: string };
  /** Focal point for object-position, e.g. "60% 40%". */
  focal?: string;
}
