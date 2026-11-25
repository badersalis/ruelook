"use client";

import { useQuery } from "@tanstack/react-query";
import { useWishlistIds } from "@/lib/wishlist";
import { getProductsByIds } from "@/lib/queries";
import { RequireAuth } from "@/components/store/RequireAuth";
import { ProductGrid } from "@/components/store/ProductCard";
import { ButtonLink } from "@/components/ui/Button";

function WishlistContent() {
  const ids = useWishlistIds();
  const list = [...(ids.data ?? [])];
  const products = useQuery({
    queryKey: ["wishlist-products", list.sort().join(",")],
    queryFn: () => getProductsByIds(list),
    enabled: !!ids.data,
    placeholderData: (prev) => prev,
  });
  const items = products.data?.filter((p) => ids.data?.has(p.id));

  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display mb-8 text-[32px] font-bold md:text-[48px]">Wishlist</h1>
      {ids.isError || products.isError ? (
        <p role="alert">Couldn&apos;t load your wishlist. Refresh to try again.</p>
      ) : ids.data && ids.data.size === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="font-display text-[24px] font-bold">Nothing saved yet</p>
          <p className="text-ink-soft">Tap the heart on any piece to keep it here. Quick add moves it to your bag.</p>
          <ButtonLink href="/shop/">Browse the drop</ButtonLink>
        </div>
      ) : (
        <ProductGrid products={items} loading={!items} skeletonCount={4} />
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  );
}
