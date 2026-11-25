"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatPrice } from "@/lib/money";
import { ButtonLink } from "@/components/ui/Button";

type OrderView = {
  number: string;
  status: string;
  created_at: string;
  email: string;
  full_name: string;
  city: string;
  country: string;
  subtotal_cents: number;
  items: { name: string; color: string | null; size: string; qty: number; unit_price_cents: number }[];
};

function Confirmation() {
  const number = useSearchParams().get("order") ?? "";
  const { session, ready } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["order", number],
    enabled: !!number && ready,
    queryFn: async () => {
      const token = sessionStorage.getItem(`ruelook-order-${number}`);
      const { data, error } = await supabase.rpc("get_order", { p_number: number, ...(token ? { p_token: token } : {}) });
      if (error) throw error;
      return data as unknown as OrderView | null;
    },
  });

  return (
    <div className="container-page flex max-w-2xl flex-col items-center gap-6 py-16 text-center">
      <svg viewBox="0 0 64 64" className="size-16 text-success" aria-hidden>
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M19 33l9 9 17-19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 className="font-display text-[32px] font-bold md:text-[44px]">Request received</h1>
      <p className="text-ink-soft">
        Order <strong className="tnum text-ink">{number}</strong> is in. This is a demo, so nothing is charged or shipped.
      </p>

      {isLoading && <div className="skeleton h-40 w-full motion-safe:animate-pulse" />}
      {data && (
        <div className="w-full rounded-[var(--radius-lg)] bg-surface p-6 text-left">
          <ul className="flex flex-col gap-2 text-[14px]">
            {data.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-4">
                <span>{i.name} · {i.size} × {i.qty}</span>
                <span className="tnum">{formatPrice(i.unit_price_cents * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold">
            <span>Subtotal</span>
            <span className="tnum">{formatPrice(data.subtotal_cents)}</span>
          </div>
          <p className="mt-3 text-[13px] text-ink-soft">Status: requested · {data.city}, {data.country}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/shop/">Continue shopping</ButtonLink>
        {session ? (
          <ButtonLink href="/account/" variant="secondary">View your orders</ButtonLink>
        ) : (
          <ButtonLink href="/account/signup/" variant="secondary">Create an account</ButtonLink>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <Confirmation />
    </Suspense>
  );
}
