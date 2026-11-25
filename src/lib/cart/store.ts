"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  color: string | null;
  size: string;
  priceCents: number;
  imagePath: string | null;
  qty: number;
  /** Max allowed (min(10, stock)) when added or last refreshed. */
  maxQty: number;
}

interface CartState {
  lines: CartLine[];
  drawerOpen: boolean;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => CartLine | undefined;
  restore: (line: CartLine) => void;
  clear: () => void;
  replaceAll: (lines: CartLine[]) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const MAX_QTY = 10;
export const clampQty = (qty: number, max: number) => Math.max(1, Math.min(qty, MAX_QTY, Math.max(1, max)));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      drawerOpen: false,
      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, ...line, qty: clampQty(l.qty + qty, line.maxQty) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, qty: clampQty(qty, line.maxQty) }] };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: clampQty(qty, l.maxQty) } : l)),
        })),
      remove: (variantId) => {
        const line = get().lines.find((l) => l.variantId === variantId);
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
        return line;
      },
      restore: (line) => set((s) => ({ lines: [...s.lines.filter((l) => l.variantId !== line.variantId), line] })),
      clear: () => set({ lines: [] }),
      replaceAll: (lines) => set({ lines }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    { name: "ruelook-bag", partialize: (s) => ({ lines: s.lines }) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty * l.priceCents, 0);

/** Merge guest lines into server lines: same variant → quantities add, capped. */
export function mergeLines(guest: CartLine[], server: CartLine[]): CartLine[] {
  const out = new Map(server.map((l) => [l.variantId, { ...l }]));
  for (const g of guest) {
    const s = out.get(g.variantId);
    if (s) out.set(g.variantId, { ...s, qty: clampQty(s.qty + g.qty, Math.min(s.maxQty, g.maxQty)) });
    else out.set(g.variantId, { ...g });
  }
  return [...out.values()];
}
