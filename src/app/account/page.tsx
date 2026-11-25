"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/store";
import { formatDate, listOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/money";
import { RequireAuth } from "@/components/store/RequireAuth";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";

function OrderDetail({ id }: { id: string }) {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", session?.user.id],
    queryFn: () => listOrders({ mine: session!.user.id }),
  });
  const order = data?.find((o) => o.id === id);
  if (isLoading) return <div className="skeleton h-40 motion-safe:animate-pulse" />;
  if (!order) return <p>Order not found. <Link href="/account/" className="underline">Back to your orders</Link></p>;
  return (
    <div className="flex flex-col gap-6">
      <Link href="/account/" className="text-[14px] underline underline-offset-4">← All orders</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display tnum text-[24px] font-bold">{order.number}</h2>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-[14px] text-ink-soft">Placed {formatDate(order.created_at)} · {order.city}, {order.country}</p>
      <ul className="divide-y divide-line rounded-[var(--radius-lg)] bg-surface px-5">
        {order.order_items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 py-3 text-[14px]">
            <span>{i.name} · {i.size}{i.color ? ` · ${i.color}` : ""} × {i.qty}</span>
            <span className="tnum">{formatPrice(i.unit_price_cents * i.qty)}</span>
          </li>
        ))}
        <li className="flex justify-between py-3 font-semibold">
          <span>Subtotal</span><span className="tnum">{formatPrice(order.subtotal_cents)}</span>
        </li>
      </ul>
    </div>
  );
}

function AccountContent() {
  const { session, profile, isAdmin } = useAuth();
  const router = useRouter();
  const orderId = useSearchParams().get("order");
  const clearBag = useCart((s) => s.clear);
  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-orders", session?.user.id],
    queryFn: () => listOrders({ mine: session!.user.id }),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    clearBag(); // the bag is saved server-side for signed-in users
    router.replace("/");
  };

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow text-denim-700">Your account</span>
          <h1 className="font-display text-[32px] font-bold md:text-[48px]">Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
          <p className="text-ink-soft">{session?.user.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <ButtonLink href="/admin/" variant="secondary">Admin</ButtonLink>}
          <ButtonLink href="/wishlist/" variant="secondary">Wishlist</ButtonLink>
          <Button variant="ghost" onClick={signOut}>Sign out</Button>
        </div>
      </div>

      <section aria-labelledby="orders-title">
        {orderId ? (
          <OrderDetail id={orderId} />
        ) : (
          <>
            <h2 id="orders-title" className="font-display mb-4 text-[24px] font-bold">Orders</h2>
            {isLoading ? (
              <div className="skeleton h-32 motion-safe:animate-pulse" />
            ) : isError ? (
              <div role="alert" className="flex items-center gap-3"><p>Couldn&apos;t load your orders.</p><Button variant="secondary" onClick={() => refetch()}>Retry</Button></div>
            ) : !orders?.length ? (
              <div className="flex flex-col items-start gap-3 rounded-[var(--radius-lg)] bg-surface p-6">
                <p>No orders yet.</p>
                <ButtonLink href="/shop/">Start shopping</ButtonLink>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius-lg)] bg-surface">
                <table className="w-full text-left text-[14px]">
                  <thead className="eyebrow text-ink-soft">
                    <tr><th scope="col" className="p-4">Order</th><th scope="col" className="p-4">Date</th><th scope="col" className="p-4">Status</th><th scope="col" className="p-4 text-right">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="p-4"><Link href={`/account/?order=${o.id}`} className="tnum font-semibold underline underline-offset-4">{o.number}</Link></td>
                        <td className="p-4">{formatDate(o.created_at)}</td>
                        <td className="p-4"><OrderStatusBadge status={o.status} /></td>
                        <td className="tnum p-4 text-right">{formatPrice(o.subtotal_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <AccountContent />
      </Suspense>
    </RequireAuth>
  );
}
