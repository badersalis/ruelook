"use client";

import { create } from "zustand";
import type { ProductSummary } from "@/lib/types";

/** Queue of products waiting for a size choice (quick add, "Add the full look"). */
interface QuickAddState {
  queue: ProductSummary[];
  total: number;
  start: (items: ProductSummary[]) => void;
  next: () => void;
  cancel: () => void;
}

export const useQuickAdd = create<QuickAddState>((set) => ({
  queue: [],
  total: 0,
  start: (items) => {
    const available = items.filter((i) => i.totalStock > 0);
    set({ queue: available, total: available.length });
  },
  next: () => set((s) => ({ queue: s.queue.slice(1) })),
  cancel: () => set({ queue: [], total: 0 }),
}));
