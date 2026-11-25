"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";

/** Client-side route guard. Real enforcement is RLS; this only improves UX. */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { session, ready, profile, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const profileLoaded = !session || profile !== null;

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace(`/account/login/?next=${encodeURIComponent(pathname + window.location.search)}`);
    } else if (admin && profileLoaded && !isAdmin) {
      toast.show("Admins only");
      router.replace("/");
    }
  }, [ready, session, admin, isAdmin, profileLoaded, router, pathname, toast]);

  if (!ready || !session || (admin && (!profileLoaded || !isAdmin))) {
    return <div className="container-page py-16"><div className="skeleton h-40 motion-safe:animate-pulse" aria-busy="true" /></div>;
  }
  return <>{children}</>;
}
