"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import clsx from "clsx";
import { CATEGORIES } from "@/lib/types";
import { cartCount, useCart } from "@/lib/cart/store";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Dialog } from "@/components/ui/Dialog";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={clsx("font-display text-[22px] font-black uppercase leading-none tracking-[0.04em]", className)}
      style={{ fontVariationSettings: '"wdth" 125' }}
    >
      Rue<span className="text-denim-700">●</span>look
      <span className="sr-only">Ruelook home</span>
    </span>
  );
}

const BANNER_KEY = "ruelook-banner-dismissed";

export function DemoBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    // Read the per-session dismissal after mount (sessionStorage is client-only)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(sessionStorage.getItem(BANNER_KEY) === "1");
  }, []);
  const onCheckout = pathname.startsWith("/checkout");
  if (dismissed && !onCheckout) return null;
  return (
    <div className="on-dark flex min-h-8 items-center justify-center gap-3 bg-denim-700 px-4 py-1.5 text-center text-[13px] text-white">
      <span>
        <strong className="font-semibold">Demo store:</strong> no payment is taken. Orders are requests only.
      </span>
      {!onCheckout && (
        <button
          type="button"
          className="grid size-7 place-items-center rounded-full hover:bg-white/15"
          aria-label="Dismiss demo notice"
          onClick={() => {
            sessionStorage.setItem(BANNER_KEY, "1");
            setDismissed(true);
          }}
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

function BagButton() {
  const lines = useCart((s) => s.lines);
  const open = useCart((s) => s.openDrawer);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []); // persisted bag is client-only; avoid hydration mismatch
  const count = mounted ? cartCount(lines) : 0;
  return (
    <button
      type="button"
      onClick={open}
      data-bag-target
      className="relative grid size-11 place-items-center rounded-full hover:bg-plinth"
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {count > 0 && (
        <span className="tnum absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-signal px-1 text-[11px] font-bold leading-5 text-ink">
          {count}
        </span>
      )}
    </button>
  );
}

function SearchForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/shop/?q=${encodeURIComponent(q.trim())}`);
    onDone?.();
  };
  return (
    <form role="search" onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search hoodies, boots, totes…"
        className="h-12 w-full rounded-[var(--radius-sm)] border border-line bg-surface px-4 text-[16px] focus:border-ink-soft"
        autoFocus
      />
      <button type="submit" className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-white" aria-label="Search">
        <Search className="size-5" aria-hidden />
      </button>
    </form>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <div className="container-page grid h-14 grid-cols-[1fr_auto_1fr] items-center md:h-16">
        <div className="flex items-center">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full hover:bg-plinth lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-6 text-[14px] font-medium">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop/?category=${c.slug}`} className="py-2 hover:underline hover:underline-offset-8">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop/" className="py-2 hover:underline hover:underline-offset-8">
                  Shop all
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <Link href="/" className="justify-self-center px-2 py-2">
          <Wordmark />
        </Link>
        <div className="flex items-center justify-end">
          <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-plinth" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <Search className="size-5" aria-hidden />
          </button>
          <Link href={session ? "/account/" : "/account/login/"} className="hidden size-11 place-items-center rounded-full hover:bg-plinth md:grid" aria-label={session ? "Your account" : "Sign in"}>
            <User className="size-5" aria-hidden />
          </Link>
          <Link href="/wishlist/" className="hidden size-11 place-items-center rounded-full hover:bg-plinth md:grid" aria-label="Wishlist">
            <Heart className="size-5" aria-hidden />
          </Link>
          <BagButton />
        </div>
      </div>

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" variant="sheet">
        <SearchForm onDone={() => setSearchOpen(false)} />
      </Dialog>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            {[...CATEGORIES.map((c) => ({ href: `/shop/?category=${c.slug}`, label: c.name })), { href: "/shop/", label: "Shop all" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setMenuOpen(false)} className="font-display block border-b border-line py-4 text-[28px] font-bold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 flex flex-col gap-1 text-[16px]">
            <li>
              <Link href={session ? "/account/" : "/account/login/"} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3">
                <User className="size-5" aria-hidden /> {session ? "Your account" : "Sign in"}
              </Link>
            </li>
            <li>
              <Link href="/wishlist/" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3">
                <Heart className="size-5" aria-hidden /> Wishlist
              </Link>
            </li>
          </ul>
        </nav>
      </Dialog>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="on-dark mt-24 bg-ink text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Wordmark className="text-[28px] [&>span:first-of-type]:text-denim-100" />
          <p className="max-w-sm text-[14px] text-white/75">
            Streetwear, picked for quality. A portfolio demo store: products, prices and orders are not real.
          </p>
        </div>
        <nav aria-label="Shop">
          <h2 className="eyebrow mb-3 text-white/60">Shop</h2>
          <ul className="flex flex-col gap-2 text-[14px]">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop/?category=${c.slug}`} className="hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Account">
          <h2 className="eyebrow mb-3 text-white/60">Account</h2>
          <ul className="flex flex-col gap-2 text-[14px]">
            <li><Link href="/account/" className="hover:underline">Your account</Link></li>
            <li><Link href="/wishlist/" className="hover:underline">Wishlist</Link></li>
            <li><Link href="/bag/" className="hover:underline">Bag</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-2 py-5 text-[13px] text-white/70 md:flex-row md:items-center md:justify-between">
          <p>
            Designed &amp; built by{" "}
            <a href="https://www.behance.net/theawesomebss" className="font-semibold text-white underline-offset-4 hover:underline" rel="noopener" target="_blank">
              bader.salis
            </a>
          </p>
          <p>Photography via Unsplash. Demo data only.</p>
        </div>
      </div>
    </footer>
  );
}
