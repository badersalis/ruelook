"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";
import { RequireAuth } from "@/components/store/RequireAuth";

const NAV = [
  { href: "/admin/", label: "Products" },
  { href: "/admin/orders/", label: "Orders" },
];

export function AdminShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireAuth admin>
      <div className="container-page py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow text-denim-700">Admin</span>
            <h1 className="font-display text-[32px] font-bold">{title}</h1>
          </div>
          {actions}
        </div>
        <nav aria-label="Admin" className="mb-8 flex gap-6 border-b border-line">
          {NAV.map((n) => {
            const active = n.href === "/admin/" ? pathname === "/admin" || pathname === "/admin/" || pathname.startsWith("/admin/product") : pathname.startsWith(n.href.replace(/\/$/, "")) || pathname.startsWith("/admin/order");
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={clsx("eyebrow relative min-h-11 py-3", active ? "text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-denim-500" : "text-ink-soft hover:text-ink")}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </RequireAuth>
  );
}
