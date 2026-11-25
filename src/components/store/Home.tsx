"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { assetUrl } from "@/lib/config";
import { listProducts } from "@/lib/queries";
import { CATEGORIES, type CategorySlug } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { buttonClass } from "@/components/ui/Button";

export function NewArrivals() {
  const [active, setActive] = useState<CategorySlug>("women");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["new-arrivals", active],
    queryFn: () => listProducts({ category: active, sort: "newest", limit: 8 }),
  });

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = CATEGORIES.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(CATEGORIES[to]!.slug);
    tabs.current[to]?.focus();
  };

  return (
    <section aria-labelledby="new-arrivals-title" className="container-page py-16 md:py-24">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <span className="eyebrow text-denim-700">Drop 07</span>
        <h2 id="new-arrivals-title" className="font-display text-[28px] font-bold md:text-[40px]">
          New Arrivals
        </h2>
      </div>
      <div role="tablist" aria-label="Categories" className="mb-8 flex justify-start gap-6 overflow-x-auto border-b border-line md:justify-center">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.slug}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={`tab-${c.slug}`}
            aria-selected={active === c.slug}
            aria-controls="new-arrivals-panel"
            tabIndex={active === c.slug ? 0 : -1}
            onClick={() => setActive(c.slug)}
            onKeyDown={(e) => onKey(e, i)}
            className={clsx(
              "eyebrow relative min-h-11 shrink-0 px-1 transition-colors",
              active === c.slug ? "text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-denim-500" : "text-ink-soft hover:text-ink",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div id="new-arrivals-panel" role="tabpanel" aria-labelledby={`tab-${active}`}>
        {isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
            <p>We couldn&apos;t load the new arrivals.</p>
            <button type="button" onClick={() => refetch()} className={buttonClass("secondary")}>
              Retry
            </button>
          </div>
        ) : data && data.items.length === 0 ? (
          <p className="py-12 text-center text-ink-soft">New pieces landing soon.</p>
        ) : (
          <ProductGrid products={data?.items} loading={isLoading} />
        )}
      </div>
      <div className="mt-10 flex justify-center">
        <Link href={`/shop/?category=${active}`} className={buttonClass("secondary")}>
          View all {CATEGORIES.find((c) => c.slug === active)?.name} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function PromoTile({
  href,
  kicker,
  title,
  image,
  className,
  imgPosition = "center",
}: {
  href: string;
  kicker: string;
  title: string;
  image: string;
  className?: string;
  imgPosition?: string;
}) {
  return (
    <Link href={href} className={clsx("group relative isolate flex min-h-[260px] flex-col justify-end overflow-hidden bg-denim-100 p-6", className)}>
      <img
        src={assetUrl(`${image}-960.webp`)}
        srcSet={`${assetUrl(`${image}-960.webp`)} 960w, ${assetUrl(`${image}-1600.webp`)} 1600w`}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt=""
        loading="lazy"
        decoding="async"
        style={{ objectPosition: imgPosition }}
        className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-[var(--motion-slow,560ms)] motion-safe:group-hover:scale-[1.03]"
      />
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
      <span className="eyebrow text-white/85">{kicker}</span>
      <span className="font-display mt-1 max-w-[14ch] text-[26px] font-bold leading-tight text-white md:text-[32px]">{title}</span>
      <span className={buttonClass("onImage", "mt-4 self-start min-h-10 px-5 text-[12px]")}>Shop now</span>
    </Link>
  );
}

export function PromoBento() {
  return (
    <section aria-label="Featured collections" className="container-page grid gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
      <PromoTile href="/shop/?category=men" kicker="Street uniform" title="Built for the block" image="campaign/promo-men" className="md:col-span-2 md:row-span-2 md:min-h-[640px]" imgPosition="50% 30%" />
      <PromoTile href="/shop/?category=women" kicker="Bold colour" title="Wear the wall" image="campaign/promo-women" className="md:col-span-2" imgPosition="50% 35%" />
      <PromoTile href="/shop/?category=shoes" kicker="Step forward" title="Footwear for the city" image="campaign/promo-shoes" />
      <Link
        href="/shop/"
        className="on-dark group relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-denim-700 p-6 text-white"
      >
        <span className="eyebrow text-white/80">New drop</span>
        <span className="font-display text-[88px] font-black leading-[0.85] md:text-[104px]" style={{ fontVariationSettings: '"wdth" 125' }}>
          40
        </span>
        <span className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">pieces, picked for quality</span>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </Link>
    </section>
  );
}

export function BagsBanner() {
  return (
    <section className="container-page mt-3 md:mt-4">
      <PromoTile href="/shop/?category=bags" kicker="Carry it all" title="Bags with somewhere to be" image="campaign/promo-bags" className="min-h-[320px] md:min-h-[380px]" imgPosition="50% 40%" />
    </section>
  );
}
