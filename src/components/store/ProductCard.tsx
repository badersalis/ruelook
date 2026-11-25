"use client";

import Link from "next/link";
import clsx from "clsx";
import { Heart, Plus } from "lucide-react";
import { imageUrl } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { useToggleWishlist } from "@/lib/wishlist";
import { useQuickAdd } from "@/lib/quickAdd";
import type { ProductSummary } from "@/lib/types";

const NEW_DAYS = 14;
/** Captured once per page load so "New" badges stay stable across re-renders. */
const PAGE_LOADED_AT = Date.now();

export function productHref(slug: string) {
  return `/product/?slug=${encodeURIComponent(slug)}`;
}

export function ProductCard({ product, priority = false }: { product: ProductSummary; priority?: boolean }) {
  const wishlist = useToggleWishlist();
  const startQuickAdd = useQuickAdd((s) => s.start);
  const saved = wishlist.isSaved(product.id);
  const [first, second] = product.images;
  const soldOut = product.totalStock === 0;
  const lowStock = !soldOut && product.totalStock <= 5;
  const isNew = PAGE_LOADED_AT - new Date(product.created_at).getTime() < NEW_DAYS * 86_400_000;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-plinth">
        <Link href={productHref(product.slug)} className="absolute inset-0" aria-label={product.name}>
          {first && (
            <img
              src={imageUrl(first.path, 640)}
              srcSet={`${imageUrl(first.path, 640)} 640w, ${imageUrl(first.path, 1200)} 1200w`}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              alt={first.alt}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className={clsx(
                "absolute inset-0 size-full object-cover transition-opacity duration-[var(--motion-base,240ms)]",
                second && "md:group-hover:opacity-0 md:group-focus-within:opacity-0",
                soldOut && "saturate-[.7]",
              )}
            />
          )}
          {second && (
            <img
              src={imageUrl(second.path, 640)}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 hidden size-full object-cover opacity-0 transition-opacity duration-[var(--motion-base,240ms)] md:block md:group-hover:opacity-100 md:group-focus-within:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {soldOut ? (
            <span className="eyebrow rounded-[var(--radius-sm)] bg-white px-2 py-1 text-ink-soft">Sold out</span>
          ) : lowStock ? (
            <span className="eyebrow rounded-[var(--radius-sm)] bg-signal px-2 py-1 text-ink">Low stock</span>
          ) : isNew ? (
            <span className="eyebrow rounded-[var(--radius-sm)] bg-ink px-2 py-1 text-white">New</span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => wishlist.toggle(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="group/heart absolute right-1 top-1 grid size-11 place-items-center rounded-full text-ink"
        >
          {/* White disc keeps the ink icon legible on dark photos (WCAG 1.4.11); the 44 px button stays the target. */}
          <span className="grid size-9 place-items-center rounded-full bg-white/85 shadow-sm transition-colors group-hover/heart:bg-white">
            <Heart className={clsx("size-5", saved && "fill-ink")} aria-hidden />
          </span>
        </button>

        {!soldOut && (
          <button
            type="button"
            onClick={() => startQuickAdd([product])}
            className="absolute inset-x-2 bottom-2 hidden min-h-11 translate-y-2 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-white text-[13px] font-semibold uppercase tracking-[0.04em] text-ink opacity-0 shadow-sm transition duration-[var(--motion-base,240ms)] focus:translate-y-0 focus:opacity-100 md:flex md:group-hover:translate-y-0 md:group-hover:opacity-100"
          >
            <Plus className="size-4" aria-hidden /> Quick add<span className="sr-only"> {product.name}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 pt-3">
        <span className="eyebrow text-ink-soft">{product.category.name}</span>
        <Link href={productHref(product.slug)} className="line-clamp-2 text-[14px] leading-5 hover:underline">
          {product.name}
        </Link>
        <span className="tnum text-[14px] font-semibold">{formatPrice(product.price_cents)}</span>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  loading,
  skeletonCount = 8,
  priorityCount = 0,
}: {
  products?: ProductSummary[];
  loading?: boolean;
  skeletonCount?: number;
  priorityCount?: number;
}) {
  if (loading || !products) {
    return (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <li key={i} className="flex flex-col gap-3">
            <div className="skeleton aspect-[4/5] motion-safe:animate-pulse" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-3/4" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
