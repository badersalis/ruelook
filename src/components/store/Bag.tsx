"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { imageUrl } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { cartSubtotal, MAX_QTY, useCart, type CartLine } from "@/lib/cart/store";
import { useQuickAdd } from "@/lib/quickAdd";
import { getProduct } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { Dialog } from "@/components/ui/Dialog";
import { Button, ButtonLink } from "@/components/ui/Button";
import { productHref } from "./ProductCard";
import { flyToBag } from "@/lib/fx/flyToBag";

/** Client-only guard for the persisted bag (avoids SSR/hydration mismatch). */
export function useHydrated() {
  const [h, setH] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setH(true), []);
  return h;
}

export function BagLines({ compact = false }: { compact?: boolean }) {
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const close = useCart((s) => s.closeDrawer);
  const toast = useToast();

  const onRemove = (l: CartLine) => {
    const removed = remove(l.variantId);
    if (removed) toast.show(`Removed ${l.name}`, { label: "Undo", onClick: () => restore(removed) });
  };

  return (
    <ul className="flex flex-col divide-y divide-line">
      {lines.map((l) => (
        <li key={l.variantId} className="flex gap-4 py-4">
          <Link href={productHref(l.slug)} onClick={close} className="block w-20 shrink-0 bg-plinth md:w-24">
            {l.imagePath && <img src={imageUrl(l.imagePath, 640)} alt="" className="aspect-[4/5] w-full object-cover" />}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <Link href={productHref(l.slug)} onClick={close} className="text-[14px] font-medium hover:underline">
                {l.name}
              </Link>
              <span className="tnum text-[14px] font-semibold">{formatPrice(l.priceCents * l.qty)}</span>
            </div>
            <p className="text-[13px] text-ink-soft">
              {[l.color, l.size !== "One size" ? `Size ${l.size}` : "One size"].filter(Boolean).join(" · ")}
              {!compact && <span className="tnum"> · {formatPrice(l.priceCents)} each</span>}
            </p>
            <div className="mt-auto flex items-center justify-between pt-2">
              <div className="flex items-center rounded-[var(--radius-pill)] border border-line" role="group" aria-label={`Quantity for ${l.name}`}>
                <button type="button" className="grid size-11 place-items-center disabled:opacity-40" aria-label="Decrease quantity" disabled={l.qty <= 1} onClick={() => setQty(l.variantId, l.qty - 1)}>
                  <Minus className="size-4" aria-hidden />
                </button>
                <span className="tnum w-6 text-center text-[14px]" aria-live="polite">{l.qty}</span>
                <button type="button" className="grid size-11 place-items-center disabled:opacity-40" aria-label="Increase quantity" disabled={l.qty >= Math.min(MAX_QTY, l.maxQty)} onClick={() => setQty(l.variantId, l.qty + 1)}>
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
              <button type="button" onClick={() => onRemove(l)} className="flex min-h-11 items-center gap-1 text-[13px] text-ink-soft hover:text-ink">
                <Trash2 className="size-4" aria-hidden /> Remove<span className="sr-only"> {l.name}</span>
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyBag({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="font-display text-[24px] font-bold">Your bag is empty</p>
      <p className="text-[14px] text-ink-soft">New pieces land every drop.</p>
      <div onClick={onNavigate}>
        <ButtonLink href="/shop/">Shop New Arrivals</ButtonLink>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const open = useCart((s) => s.drawerOpen);
  const close = useCart((s) => s.closeDrawer);
  const lines = useCart((s) => s.lines);
  const hydrated = useHydrated();
  const subtotal = cartSubtotal(lines);

  return (
    <Dialog
      open={open && hydrated}
      onClose={close}
      title="Your bag"
      footer={
        lines.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[16px] font-semibold">
              <span>Subtotal</span>
              <span className="tnum">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[13px] text-ink-soft">Shipping calculated at checkout (demo).</p>
            <div onClick={close} className="flex flex-col gap-2">
              <ButtonLink href="/checkout/">Checkout</ButtonLink>
              <Link href="/bag/" className="text-center text-[14px] underline underline-offset-4">
                View bag
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      {lines.length ? <BagLines compact /> : <EmptyBag onNavigate={close} />}
    </Dialog>
  );
}

/** Size picker sheet for quick add and "Add the full look" (steps through the queue). */
export function QuickAddSheet() {
  const queue = useQuickAdd((s) => s.queue);
  const total = useQuickAdd((s) => s.total);
  const next = useQuickAdd((s) => s.next);
  const cancel = useQuickAdd((s) => s.cancel);
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const toast = useToast();
  const current = queue[0];
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", current?.slug],
    queryFn: () => getProduct(current!.slug),
    enabled: !!current,
  });

  // Reset the choice when the queue moves to the next product (render-time reset, no effect)
  const [shownId, setShownId] = useState(current?.id);
  if (shownId !== current?.id) {
    setShownId(current?.id);
    setSize(null);
    setError(false);
  }

  // Single-size products skip the choice
  const variants = product?.variants ?? [];
  const onlyOne = variants.length === 1 ? variants[0] : undefined;

  const confirm = (e?: React.MouseEvent<HTMLElement>) => {
    if (!product) return;
    const v = onlyOne ?? variants.find((x) => x.size === size);
    if (!v) {
      setError(true);
      return;
    }
    const img = product.images[0]?.path ?? null;
    add({
      variantId: v.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: product.colors[0]?.name ?? null,
      size: v.size,
      priceCents: product.price_cents,
      imagePath: img,
      maxQty: Math.min(MAX_QTY, v.stock),
    });
    if (e && img) flyToBag(e.currentTarget, imageUrl(img, 640));
    toast.announce(`Added ${product.name} to bag`);
    const last = queue.length <= 1;
    next();
    if (last) openDrawer();
  };

  const step = total > 1 && current ? total - queue.length + 1 : 0;

  return (
    <Dialog open={!!current} onClose={cancel} title={step ? `Choose a size (${step} of ${total})` : "Choose a size"} variant="sheet">
      {current && (
        <div className="flex flex-col gap-5">
          <div className="flex gap-4">
            {current.images[0] && <img src={imageUrl(current.images[0].path, 640)} alt="" className="aspect-[4/5] w-20 bg-plinth object-cover" />}
            <div>
              <p className="font-medium">{current.name}</p>
              <p className="tnum text-[14px] font-semibold">{formatPrice(current.price_cents)}</p>
            </div>
          </div>
          {isLoading && <div className="skeleton h-24 motion-safe:animate-pulse" />}
          {isError && <p role="alert" className="text-danger">Couldn&apos;t load sizes. Close and try again.</p>}
          {product && !onlyOne && (
            <fieldset aria-describedby={error ? "qa-size-error" : undefined}>
              <legend className="eyebrow mb-2">Size</legend>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <label key={v.id} className={clsx("relative", v.stock === 0 && "cursor-not-allowed")}>
                    <input
                      type="radio"
                      name="qa-size"
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
                        "grid h-11 min-w-12 place-items-center rounded-[var(--radius-sm)] border px-3 text-[14px] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-ink peer-focus-visible:outline-offset-2",
                        v.stock === 0 ? "border-line text-ink-soft line-through" : "border-line hover:border-ink",
                      )}
                    >
                      {v.size}
                      {v.stock === 0 && <span className="sr-only"> (out of stock)</span>}
                    </span>
                  </label>
                ))}
              </div>
              {error && (
                <p id="qa-size-error" role="alert" className="mt-2 text-[13px] text-danger">
                  Select a size
                </p>
              )}
            </fieldset>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={confirm} disabled={!product}>
              Add to bag
            </Button>
            {total > 1 && (
              <Button variant="ghost" onClick={next}>
                Skip
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
