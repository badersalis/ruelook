"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { formatDate, getOrderById, NEXT_STATUS, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/money";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

function OrderView() {
  const id = useSearchParams().get("id") ?? "";
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: order, isLoading } = useQuery({ queryKey: ["admin-order", id], queryFn: () => getOrderById(id), enabled: !!id });

  const advance = async (to: OrderStatus) => {
    if (to === "cancelled" && !window.confirm("Cancel this order? Any stock taken when it was confirmed goes back to inventory.")) return;
    setBusy(to);
    setError(null);
    const { error } = await supabase.rpc("admin_set_order_status", { p_order: id, p_status: to });
    setBusy(null);
    if (error) return setError(error.message.includes("not enough stock") ? "Not enough stock to confirm this order. Restock the sizes first." : "Couldn't update the status. Refresh and try again.");
    toast.show(`Order marked ${STATUS_LABEL[to].toLowerCase()}`);
    await qc.invalidateQueries({ queryKey: ["admin-order", id] });
    await qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (isLoading) return <div className="skeleton h-64 motion-safe:animate-pulse" />;
  if (!order) return <p role="alert">Order not found.</p>;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <Link href="/admin/orders/" className="text-[14px] underline underline-offset-4">← All orders</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display tnum text-[24px] font-bold">{order.number}</h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <ul className="divide-y divide-line rounded-[var(--radius-lg)] bg-surface px-5">
          {order.order_items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3 text-[14px]">
              <span>{i.name} · {i.size}{i.color ? ` · ${i.color}` : ""} × {i.qty}</span>
              <span className="tnum">{formatPrice(i.unit_price_cents * i.qty)}</span>
            </li>
          ))}
          <li className="flex justify-between py-3 font-semibold"><span>Subtotal</span><span className="tnum">{formatPrice(order.subtotal_cents)}</span></li>
        </ul>
      </div>
      <aside className="flex flex-col gap-6">
        <section className="rounded-[var(--radius-lg)] bg-surface p-5 text-[14px]" aria-labelledby="cust">
          <h3 id="cust" className="eyebrow mb-3 text-ink-soft">Customer</h3>
          <p className="font-medium">{order.full_name}</p>
          <p>{order.email}</p>
          <p>{order.phone}</p>
          <p className="mt-2">{order.address}<br />{order.city}, {order.country}</p>
          <p className="mt-2 text-ink-soft">Placed {formatDate(order.created_at)}{order.user_id ? "" : " · guest"}</p>
        </section>
        <section aria-labelledby="actions" className="flex flex-col gap-2">
          <h3 id="actions" className="eyebrow text-ink-soft">Update status</h3>
          {NEXT_STATUS[order.status].length === 0 ? (
            <p className="text-[14px] text-ink-soft">No further steps for a {STATUS_LABEL[order.status].toLowerCase()} order.</p>
          ) : (
            NEXT_STATUS[order.status].map((s) => (
              <Button key={s} variant={s === "cancelled" ? "ghost" : "primary"} loading={busy === s} disabled={!!busy} onClick={() => advance(s)}>
                {s === "cancelled" ? "Cancel order" : `Mark ${STATUS_LABEL[s].toLowerCase()}`}
              </Button>
            ))
          )}
          {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
        </section>
      </aside>
    </div>
  );
}

export default function AdminOrderPage() {
  return (
    <AdminShell title="Order">
      <Suspense fallback={null}>
        <OrderView />
      </Suspense>
    </AdminShell>
  );
}
