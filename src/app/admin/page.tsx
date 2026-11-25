"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminListProducts } from "@/lib/admin";
import { imageUrl } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function AdminProductsPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["admin-products"], queryFn: adminListProducts });
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [data, q]);

  return (
    <AdminShell title="Products" actions={<ButtonLink href="/admin/product/">New product</ButtonLink>}>
      <label htmlFor="admin-q" className="sr-only">Filter products</label>
      <input id="admin-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name" className="mb-6 h-12 w-full max-w-sm rounded-[var(--radius-sm)] border border-line bg-surface px-4" />
      {isLoading ? (
        <div className="skeleton h-64 motion-safe:animate-pulse" />
      ) : isError ? (
        <div role="alert" className="flex items-center gap-3"><p>Couldn&apos;t load products.</p><Button variant="secondary" onClick={() => refetch()}>Retry</Button></div>
      ) : rows.length === 0 ? (
        <p className="text-ink-soft">No products match.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] bg-surface">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="eyebrow text-ink-soft">
              <tr>
                <th scope="col" className="p-3">Product</th>
                <th scope="col" className="p-3">Category</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3 text-right">Stock</th>
                <th scope="col" className="p-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const img = [...p.product_images].sort((a, b) => a.sort - b.sort)[0];
                const stock = p.product_variants.reduce((n, v) => n + v.stock, 0);
                return (
                  <tr key={p.id}>
                    <td className="p-3">
                      <Link href={`/admin/product/?id=${p.id}`} className="flex items-center gap-3 font-medium hover:underline">
                        {img ? <img src={imageUrl(img.path, 640)} alt="" className="aspect-[4/5] w-10 bg-plinth object-cover" /> : <span className="aspect-[4/5] w-10 bg-plinth" />}
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3">{p.categories?.name}</td>
                    <td className="p-3 capitalize">{p.status}</td>
                    <td className={`tnum p-3 text-right ${stock === 0 ? "text-danger" : ""}`}>{stock}</td>
                    <td className="tnum p-3 text-right">{formatPrice(p.price_cents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
