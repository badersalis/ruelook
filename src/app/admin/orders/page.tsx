"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { formatDate, listOrders, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/money";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Button } from "@/components/ui/Button";

const FILTERS: (OrderStatus | null)[] = [null, "requested", "confirmed", "shipped", "completed", "cancelled"];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["admin-orders", status], queryFn: () => listOrders({ status }) });

  return (
    <AdminShell title="Orders">
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((s) => (
          <button
            key={s ?? "all"}
            type="button"
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
            className={clsx("min-h-11 rounded-[var(--radius-pill)] border px-4 text-[13px] font-semibold", status === s ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
          >
            {s ? STATUS_LABEL[s] : "All"}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="skeleton h-64 motion-safe:animate-pulse" />
      ) : isError ? (
        <div role="alert" className="flex items-center gap-3"><p>Couldn&apos;t load orders.</p><Button variant="secondary" onClick={() => refetch()}>Retry</Button></div>
      ) : !data?.length ? (
        <p className="text-ink-soft">No orders{status ? ` with status “${STATUS_LABEL[status]}”` : ""} yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] bg-surface">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="eyebrow text-ink-soft">
              <tr><th scope="col" className="p-3">Order</th><th scope="col" className="p-3">Customer</th><th scope="col" className="p-3">Date</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((o) => (
                <tr key={o.id}>
                  <td className="p-3"><Link href={`/admin/order/?id=${o.id}`} className="tnum font-semibold underline underline-offset-4">{o.number}</Link></td>
                  <td className="p-3">{o.full_name}<span className="block text-[12px] text-ink-soft">{o.city}, {o.country}</span></td>
                  <td className="p-3">{formatDate(o.created_at)}</td>
                  <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="tnum p-3 text-right">{formatPrice(o.subtotal_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
