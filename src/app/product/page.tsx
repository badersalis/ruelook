"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Sparkles } from "lucide-react";
import clsx from "clsx";
import { config, imageUrl } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { getProduct, listProducts } from "@/lib/queries";
import { fetchStoredLooks, generateLooksLocal } from "@/lib/ai/stylist";
import { MAX_QTY, useCart } from "@/lib/cart/store";
import { useQuickAdd } from "@/lib/quickAdd";
import { useToggleWishlist } from "@/lib/wishlist";
import type { Look, ProductDetail } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ProductGrid } from "@/components/store/ProductCard";
import { LookBoard } from "@/components/fx/LookBoard";
import { flyToBag } from "@/lib/fx/flyToBag";

function Gallery({ product }: { product: ProductDetail }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const images = product.images;

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="flex gap-4">
      <ul className="hidden w-20 shrink-0 flex-col gap-3 md:flex" aria-label="Product images">
        {images.map((im, i) => (
          <li key={im.path}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={index === i}
              className={clsx("block w-full bg-plinth ring-offset-2", index === i && "ring-2 ring-ink")}
            >
              <img src={imageUrl(im.path, 640)} alt="" className="aspect-[4/5] w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative min-w-0 flex-1">
        {/* Mobile: swipe carousel */}
        <div
          ref={scroller}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto md:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Product images, swipe to browse"
          tabIndex={0}
        >
          {images.map((im, i) => (
            <img
              key={im.path}
              src={imageUrl(im.path, 640)}
              srcSet={`${imageUrl(im.path, 640)} 640w, ${imageUrl(im.path, 1200)} 1200w`}
              sizes="100vw"
              alt={im.alt}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              className="aspect-[4/5] w-full shrink-0 snap-center bg-plinth object-cover"
            />
          ))}
        </div>
        <span className="tnum absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold md:hidden" aria-hidden>
          {index + 1} / {images.length}
        </span>

        {/* Desktop: main image, click to zoom */}
        {images[index] && (
          <button type="button" onClick={() => setZoom(true)} className="hidden w-full cursor-zoom-in bg-plinth md:block" aria-label="Zoom image">
            <img
              src={imageUrl(images[index].path, 1200)}
              alt={images[index].alt}
              fetchPriority={index === 0 ? "high" : undefined}
              className="aspect-[4/5] w-full object-cover"
            />
          </button>
        )}
      </div>

      <Dialog open={zoom} onClose={() => setZoom(false)} title={product.name} variant="sheet">
        {images[index] && <img src={imageUrl(images[index].path, 1200)} alt={images[index].alt} className="w-full" />}
      </Dialog>
    </div>
  );
}

function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-line" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-[20px] transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-5 text-[15px] leading-6 text-ink-soft">{children}</div>
    </details>
  );
}

function BuyBox({ product }: { product: ProductDetail }) {
  const [colorId, setColorId] = useState(product.colors[0]?.id ?? null);
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const sizeGroup = useRef<HTMLFieldSetElement>(null);
  const cta = useRef<HTMLButtonElement>(null);
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const toast = useToast();
  const wishlist = useToggleWishlist();
  const saved = wishlist.isSaved(product.id);

  const variants = product.variants.filter((v) => !colorId || v.color_id === colorId || v.color_id === null);
  const single = variants.length === 1 ? variants[0] : undefined;
  const soldOut = variants.every((v) => v.stock === 0);
  const chosen = single ?? variants.find((v) => v.size === size);
  const color = product.colors.find((c) => c.id === colorId);

  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStickyVisible(!e!.isIntersecting && e!.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToBag = (from: HTMLElement) => {
    if (!chosen) {
      setError(true);
      sizeGroup.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    add({
      variantId: chosen.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: color?.name ?? null,
      size: chosen.size,
      priceCents: product.price_cents,
      imagePath: product.images[0]?.path ?? null,
      maxQty: Math.min(MAX_QTY, chosen.stock),
    });
    if (product.images[0]) flyToBag(from, imageUrl(product.images[0].path, 640));
    toast.announce(`Added ${product.name}, size ${chosen.size}, to bag`);
    setTimeout(openDrawer, 450);
  };

  const stockLine = chosen
    ? chosen.stock === 0
      ? { text: "Out of stock", cls: "text-danger" }
      : chosen.stock <= 3
        ? { text: `Only ${chosen.stock} left`, cls: "text-ink before:mr-2 before:inline-block before:size-2 before:rounded-full before:bg-signal" }
        : { text: "In stock", cls: "text-success" }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="text-[13px] text-ink-soft">
          <ol className="flex gap-2">
            <li><Link href="/shop/" className="hover:underline">Shop</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/shop/?category=${product.category.slug}`} className="hover:underline">{product.category.name}</Link></li>
          </ol>
        </nav>
        {product.drop_label && <span className="eyebrow text-denim-700">{product.drop_label}</span>}
        <h1 className="font-display text-[28px] font-bold leading-tight md:text-[36px]">{product.name}</h1>
        <p className="tnum text-[20px] font-semibold">{formatPrice(product.price_cents)}</p>
      </div>

      {product.colors.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-2">
            Colour: <span className="font-normal normal-case tracking-normal text-ink-soft">{color?.name}</span>
          </legend>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <label key={c.id} className="relative">
                <input type="radio" name="colour" className="peer sr-only" checked={colorId === c.id} onChange={() => setColorId(c.id)} />
                <span className="grid size-11 place-items-center rounded-full border border-line peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                  <span className="size-8 rounded-full border border-black/10" style={{ background: c.hex }} />
                </span>
                <span className="sr-only">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {!single && (
        <fieldset ref={sizeGroup} aria-describedby={error ? "size-error" : undefined} aria-invalid={error || undefined}>
          <legend className="eyebrow mb-2">Size</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label key={v.id} className={clsx("relative", v.stock === 0 && "cursor-not-allowed")}>
                <input
                  type="radio"
                  name="size"
                  value={v.size}
                  className="peer sr-only"
                  disabled={v.stock === 0}
                  checked={size === v.size}
                  onChange={() => {
                    setSize(v.size);
                    setError(false);
                  }}
                />
                <span
                  className={clsx(
                    "grid h-12 min-w-14 place-items-center rounded-[var(--radius-sm)] border px-3 text-[14px] transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                    v.stock === 0 ? "border-line bg-plinth/60 text-ink-soft line-through" : "border-line bg-surface hover:border-ink",
                  )}
                >
                  {v.size}
                  {v.stock === 0 && <span className="sr-only"> (out of stock)</span>}
                </span>
              </label>
            ))}
          </div>
          {error && (
            <p id="size-error" role="alert" className="mt-2 text-[14px] font-medium text-danger">
              Select a size
            </p>
          )}
        </fieldset>
      )}

      {stockLine && <p className={clsx("text-[14px] font-medium", stockLine.cls)}>{stockLine.text}</p>}

      <div className="flex gap-2">
        <Button ref={cta} className="flex-1" disabled={soldOut} onClick={(e) => addToBag(e.currentTarget)}>
          {soldOut ? "Sold out" : "Add to bag"}
        </Button>
        <button
          type="button"
          onClick={() => wishlist.toggle(product.id)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="grid size-12 place-items-center rounded-full border border-ink hover:bg-plinth"
        >
          <Heart className={clsx("size-5", saved && "fill-ink")} aria-hidden />
        </button>
      </div>

      <div>
        <Accordion title="Details" defaultOpen>
          <p>{product.description}</p>
        </Accordion>
        <Accordion title="Material & care">
          <p>{product.material_care}</p>
        </Accordion>
        <Accordion title="Shipping">
          <p>Demo store: orders are requests, no payment is taken and nothing ships. In a live store this would list delivery times for Ghana, Nigeria and the rest of West Africa.</p>
        </Accordion>
      </div>

      {/* Mobile sticky buy bar once the main CTA scrolls away */}
      {!soldOut && (
        <div
          className={clsx(
            "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface px-4 py-3 transition-transform duration-[var(--motion-base,240ms)] md:hidden",
            stickyVisible ? "translate-y-0" : "translate-y-full",
          )}
          aria-hidden={!stickyVisible}
        >
          <span className="tnum font-semibold">{formatPrice(product.price_cents)}</span>
          <Button className="flex-1" tabIndex={stickyVisible ? 0 : -1} onClick={(e) => (chosen ? addToBag(e.currentTarget) : window.scrollTo({ top: 0, behavior: "smooth" }))}>
            {chosen ? "Add to bag" : "Choose a size"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Stylist({ product }: { product: ProductDetail }) {
  const qc = useQueryClient();
  const startQuickAdd = useQuickAdd((s) => s.start);
  const [localLooks, setLocalLooks] = useState<Look[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const looksQ = useQuery({ queryKey: ["looks", product.id], queryFn: () => fetchStoredLooks(product.id) });

  const regenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      setLocalLooks(await generateLooksLocal(product));
    } catch {
      setGenError("The stylist is taking a break. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const looks = localLooks ?? looksQ.data ?? [];
  const isLocal = config.aiMode === "local";
  // Live demo: hide the section when there are no stored looks (AC-8 fallback)
  if (!isLocal && !looksQ.isLoading && !looksQ.isError && looks.length === 0) return null;

  return (
    <section className="container-page py-16" aria-label="AI Stylist">
      <LookBoard
        current={product}
        looks={looks}
        loading={looksQ.isLoading || generating}
        error={genError ?? (looksQ.isError ? "We couldn't load the looks." : null)}
        onRetry={genError ? regenerate : () => void qc.invalidateQueries({ queryKey: ["looks", product.id] })}
        onQuickAdd={(p) => startQuickAdd([p])}
        onAddAll={(items) => startQuickAdd(items)}
        footerSlot={
          isLocal ? (
            <Button variant="ghost" onClick={regenerate} loading={generating}>
              <Sparkles className="size-4" aria-hidden /> Regenerate (local AI)
            </Button>
          ) : (
            <p className="text-[13px] text-ink-soft">Looks generated with Llama 3.1 running locally, served in demo mode.</p>
          )
        }
      />
    </section>
  );
}

function Related({ product }: { product: ProductDetail }) {
  const { data, isLoading } = useQuery({
    queryKey: ["related", product.id],
    queryFn: () => listProducts({ category: product.category.slug, excludeId: product.id, limit: 4 }),
  });
  if (!isLoading && !data?.items.length) return null;
  return (
    <section aria-labelledby="related-title" className="container-page py-12">
      <h2 id="related-title" className="font-display mb-8 text-[28px] font-bold">
        You may also like
      </h2>
      <ProductGrid products={data?.items} loading={isLoading} skeletonCount={4} />
    </section>
  );
}

function ProductContent() {
  const slug = useSearchParams().get("slug") ?? "";
  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (product) document.title = `${product.name} · Ruelook`;
  }, [product]);

  if (isLoading) {
    return (
      <div className="container-page grid gap-10 py-10 md:grid-cols-12" aria-busy="true" aria-label="Loading product">
        <div className="skeleton aspect-[4/5] motion-safe:animate-pulse md:col-span-7" />
        <div className="flex flex-col gap-4 md:col-span-5">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-6 w-1/4" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div role="alert" className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <p>We couldn&apos;t load this piece.</p>
        <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <p className="eyebrow text-denim-700">404</p>
        <h1 className="font-display text-[32px] font-bold">This piece has left the building</h1>
        <p className="text-ink-soft">It may have sold out or moved. The rest of the drop is still here.</p>
        <ButtonLink href="/shop/">Back to the shop</ButtonLink>
      </div>
    );
  }

  return (
    <>
      <div className="container-page grid gap-8 py-6 md:grid-cols-12 md:gap-10 md:py-10">
        <div className="md:col-span-7">
          <Gallery product={product} />
        </div>
        <div className="md:sticky md:top-24 md:col-span-5 md:self-start">
          <BuyBox key={product.id} product={product} />
        </div>
      </div>
      <Stylist product={product} />
      <Related product={product} />
    </>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="container-page py-10"><div className="skeleton aspect-[4/5] max-w-xl" /></div>}>
      <ProductContent />
    </Suspense>
  );
}
