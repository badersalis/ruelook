import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type Variant = "primary" | "secondary" | "ghost" | "onImage";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] text-[14px] font-semibold uppercase tracking-[0.04em] transition-colors duration-[var(--motion-fast,120ms)] disabled:cursor-not-allowed disabled:opacity-50 min-h-12 px-6";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-denim-700",
  secondary: "border border-ink text-ink bg-transparent hover:bg-ink hover:text-white",
  ghost: "text-ink hover:bg-plinth px-4",
  onImage: "bg-white text-ink hover:bg-denim-100",
};

export function buttonClass(variant: Variant = "primary", extra?: string) {
  return clsx(base, variants[variant], extra);
}

export function Button({
  variant = "primary",
  className,
  loading,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button {...rest} className={buttonClass(variant, className)} aria-busy={loading || undefined} disabled={rest.disabled || loading}>
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
