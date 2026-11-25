"use client";

import { BagLines, EmptyBag, useHydrated } from "@/components/store/Bag";
import { ButtonLink } from "@/components/ui/Button";
import { cartSubtotal, useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/money";

export default function BagPage() {
  const lines = useCart((s) => s.lines);
  const hydrated = useHydrated();
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display mb-8 text-[32px] font-bold md:text-[48px]">Your bag</h1>
      {!hydrated ? (
        <div className="skeleton h-40 motion-safe:animate-pulse" aria-busy="true" />
      ) : lines.length === 0 ? (
        <EmptyBag />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <BagLines />
          <aside className="h-fit rounded-[var(--radius-lg)] bg-surface p-6" aria-label="Order summary">
            <h2 className="font-display mb-4 text-[20px] font-bold">Summary</h2>
            <dl className="flex flex-col gap-2 text-[15px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tnum font-semibold">{formatPrice(cartSubtotal(lines))}</dd></div>
              <div className="flex justify-between text-ink-soft"><dt>Shipping</dt><dd>Calculated at checkout (demo)</dd></div>
            </dl>
            <ButtonLink href="/checkout/" className="mt-6 w-full">Checkout</ButtonLink>
          </aside>
        </div>
      )}
    </div>
  );
}
