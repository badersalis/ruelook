"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";

const PENDING_KEY = "ruelook-pending-wishlist";

export function useWishlistIds() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["wishlist-ids", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("product_id");
      if (error) throw error;
      return new Set(data.map((r) => r.product_id));
    },
  });
}

export function useToggleWishlist() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const ids = useWishlistIds().data;

  const m = useMutation({
    mutationFn: async ({ productId, saved }: { productId: string; saved: boolean }) => {
      if (!uid) return;
      if (saved) {
        const { error } = await supabase.from("wishlist_items").delete().eq("user_id", uid).eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wishlist_items").upsert({ user_id: uid, product_id: productId });
        if (error) throw error;
      }
    },
    onMutate: async ({ productId, saved }) => {
      const key = ["wishlist-ids", uid];
      const prev = qc.getQueryData<Set<string>>(key);
      const next = new Set(prev);
      if (saved) next.delete(productId);
      else next.add(productId);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["wishlist-ids", uid], ctx?.prev);
      toast.show("Couldn't update your wishlist. Try again.");
    },
    onSuccess: (_d, { saved }) => {
      toast.announce(saved ? "Removed from wishlist" : "Saved to wishlist");
      void qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  return {
    isSaved: (productId: string) => !!ids?.has(productId),
    toggle: (productId: string) => {
      if (!uid) {
        sessionStorage.setItem(PENDING_KEY, productId);
        const next = pathname + window.location.search;
        router.push(`/account/login/?next=${encodeURIComponent(next)}&reason=wishlist`);
        return;
      }
      m.mutate({ productId, saved: !!ids?.has(productId) });
    },
  };
}

/** After login, save the item the guest tried to save. */
export async function flushPendingWishlist(uid: string) {
  const pid = sessionStorage.getItem(PENDING_KEY);
  if (!pid) return false;
  sessionStorage.removeItem(PENDING_KEY);
  const { error } = await supabase.from("wishlist_items").upsert({ user_id: uid, product_id: pid });
  return !error;
}
