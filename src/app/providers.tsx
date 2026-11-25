"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { useCartSync } from "@/lib/cart/sync";
import { CartDrawer, QuickAddSheet } from "@/components/store/Bag";
import { ToastRegion } from "@/components/ui/Toast";

function CartSync() {
  useCartSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <CartSync />
        {children}
        <CartDrawer />
        <QuickAddSheet />
        <ToastRegion />
      </AuthProvider>
    </QueryClientProvider>
  );
}
