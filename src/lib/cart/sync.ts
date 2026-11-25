"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { MAX_QTY, mergeLines, useCart, type CartLine } from "./store";

type ServerRow = {
  qty: number;
  variant_id: string;
  product_variants: {
    size: string;
    stock: number;
    product_colors: { name: string } | null;
    products: {
      id: string;
      slug: string;
      name: string;
      price_cents: number;
      product_images: { path: string; sort: number }[];
    };
  };
};

async function fetchServerCart(): Promise<CartLine[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "qty, variant_id, product_variants!inner(size, stock, product_colors(name), products!inner(id, slug, name, price_cents, product_images(path, sort)))",
    );
  if (error) throw error;
  return (data as unknown as ServerRow[]).map((r) => {
    const v = r.product_variants;
    const img = [...v.products.product_images].sort((a, b) => a.sort - b.sort)[0];
    return {
      variantId: r.variant_id,
      productId: v.products.id,
      slug: v.products.slug,
      name: v.products.name,
      color: v.product_colors?.name ?? null,
      size: v.size,
      priceCents: v.products.price_cents,
      imagePath: img?.path ?? null,
      qty: r.qty,
      maxQty: Math.max(1, Math.min(MAX_QTY, v.stock)),
    };
  });
}

/** On login: merge the guest bag into the account bag, then write through on every change. */
export function useCartSync() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const merged = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || merged.current === uid) return;
    merged.current = uid;
    (async () => {
      try {
        const server = await fetchServerCart();
        useCart.getState().replaceAll(mergeLines(useCart.getState().lines, server));
      } catch {
        // Keep the local bag; the write-through below retries on the next change.
      }
    })();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let prev = useCart.getState().lines;
    return useCart.subscribe((s) => {
      const lines = s.lines;
      if (lines === prev) return;
      const removed = prev.filter((p) => !lines.some((l) => l.variantId === p.variantId));
      prev = lines;
      void (async () => {
        if (lines.length) {
          await supabase.from("cart_items").upsert(
            lines.map((l) => ({ user_id: uid, variant_id: l.variantId, qty: l.qty, updated_at: new Date().toISOString() })),
          );
        }
        if (removed.length) {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", uid)
            .in(
              "variant_id",
              removed.map((r) => r.variantId),
            );
        }
      })();
    });
  }, [uid]);
}
