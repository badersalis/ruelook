"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { listProducts, PAGE_SIZE, type SortKey } from "@/lib/queries";
import { CATEGORIES, type CategorySlug } from "@/lib/types";
import { ProductGrid } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function isCategory(v: string | null): v is CategorySlug {
  return !!v && CATEGORIES.some((c) => c.slug === v);
}

function Filters({
  category,
  sort,
  onChange,
  idPrefix,
}: {
  category: CategorySlug | null;
  sort: SortKey;
  onChange: (patch: Record<string, string | null>) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="eyebrow mb-3">Category</legend>
        <div className="flex flex-col gap-1">
          {[{ slug: null, name: "All" }, ...CATEGORIES].map((c) => (
            <label key={c.slug ?? "all"} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="radio"
                name={`${idPrefix}-category`}
                checked={category === c.slug}
                onChange={() => onChange({ category: c.slug })}
                className="size-4 accent-[var(--color-ink)]"
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${idPrefix}-sort`} className="eyebrow mb-3 block">
          Sort by
        </label>
        <select
          id={`${idPrefix}-sort`}
          value={sort}
          onChange={(e) => onChange({ sort: e.target.value === "newest" ? null : e.target.value })}
          className="h-12 w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 text-[15px]"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ShopContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const announce = useToast((s) => s.announce);
  const rawCat = params.get("category");
  const category = isCategory(rawCat) ? rawCat : null;
  const sortParam = params.get("sort") as SortKey | null;
  const sort: SortKey = SORTS.some((s) => s.value === sortParam) ? sortParam! : "newest";
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);
  const [sheet, setSheet] = useState(false);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Debounced search → URL (300 ms, ux-spec)
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => update({ q: search.trim().length >= 2 ? search.trim() : null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ["shop", category, sort, q],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listProducts({ category, sort, q, page: pageParam }),
    getNextPageParam: (last, all) => (all.length * PAGE_SIZE < last.total ? all.length : undefined),
  });
  const items = query.data?.pages.flatMap((p) => p.items);
  const total = query.data?.pages[0]?.total ?? 0;

  useEffect(() => {
    if (query.data) announce(`${total} ${total === 1 ? "piece" : "pieces"} found`);
  }, [query.data, total, announce]);

  const title = category ? CATEGORIES.find((c) => c.slug === category)!.name : q ? `Results for “${q}”` : "Shop all";
  const hasFilters = !!category || !!q || sort !== "newest";

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8 flex flex-col gap-2">
        <span className="eyebrow text-denim-700">Drop 07</span>
        <h1 className="font-display text-[32px] font-bold md:text-[48px]">{title}</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <Filters category={category} sort={sort} onChange={update} idPrefix="side" />
        </aside>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 md:max-w-sm">
              <label htmlFor="shop-search" className="sr-only">
                Search products
              </label>
              <input
                id="shop-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name"
                className="h-12 w-full rounded-[var(--radius-sm)] border border-line bg-surface px-4 text-[16px]"
              />
            </div>
            <p className="tnum text-[14px] text-ink-soft" aria-hidden>
              {query.data ? `${total} ${total === 1 ? "piece" : "pieces"}` : " "}
            </p>
          </div>

          <div className="sticky top-16 z-30 -mx-4 bg-canvas/95 px-4 py-2 lg:hidden">
            <Button variant="secondary" className="w-full" onClick={() => setSheet(true)}>
              <SlidersHorizontal className="size-4" aria-hidden /> Filter &amp; sort
            </Button>
          </div>

          {query.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
              <p>Something went wrong loading the shop.</p>
              <Button variant="secondary" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          ) : items && items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="font-display text-[24px] font-bold">No pieces match</p>
              <p className="text-ink-soft">Try another category or a shorter search.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  router.replace(pathname);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <ProductGrid products={items} loading={query.isLoading} skeletonCount={12} priorityCount={4} />
          )}

          {query.hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                Load more
              </Button>
            </div>
          )}
          {hasFilters && items && items.length > 0 && (
            <button
              type="button"
              className={clsx("self-start text-[14px] underline underline-offset-4")}
              onClick={() => {
                setSearch("");
                router.replace(pathname);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} title="Filter & sort" variant="sheet" footer={<Button className="w-full" onClick={() => setSheet(false)}>Show {total} pieces</Button>}>
        <Filters category={category} sort={sort} onChange={update} idPrefix="sheet" />
      </Dialog>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-page py-14"><ProductGrid loading skeletonCount={12} /></div>}>
      <ShopContent />
    </Suspense>
  );
}
