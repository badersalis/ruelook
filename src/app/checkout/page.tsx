"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cartSubtotal, useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/money";
import { imageUrl } from "@/lib/config";
import { checkoutErrorMessage, checkoutSchema, COUNTRIES, type CheckoutValues } from "@/lib/checkout";
import { Button } from "@/components/ui/Button";
import { EmptyBag, useHydrated } from "@/components/store/Bag";

const FIELDS: { name: keyof CheckoutValues; label: string; type?: string; autoComplete: string }[] = [
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "full_name", label: "Full name", autoComplete: "name" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "address", label: "Street address", autoComplete: "street-address" },
];

export default function CheckoutPage() {
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const hydrated = useHydrated();
  const router = useRouter();
  const { session, profile } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
    defaultValues: { country: "Ghana" },
  });

  useEffect(() => {
    if (session?.user.email) setValue("email", session.user.email);
    if (profile?.full_name) setValue("full_name", profile.full_name);
    if (profile?.phone) setValue("phone", profile.phone);
  }, [session, profile, setValue]);

  const errorList = Object.entries(errors) as [keyof CheckoutValues, { message?: string }][];
  useEffect(() => {
    if (submitCount > 0 && errorList.length) summaryRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const onSubmit = async (values: CheckoutValues) => {
    setServerError(null);
    const { data, error } = await supabase.rpc("place_order", {
      items: lines.map((l) => ({ variant_id: l.variantId, qty: l.qty })),
      contact: values,
    });
    const row = data?.[0];
    if (error || !row) {
      setServerError(checkoutErrorMessage(error?.message ?? ""));
      return;
    }
    sessionStorage.setItem(`ruelook-order-${row.order_number}`, row.guest_token);
    clear();
    router.push(`/checkout/confirmation/?order=${row.order_number}`);
  };

  if (!hydrated) return <div className="container-page py-14"><div className="skeleton h-64 motion-safe:animate-pulse" /></div>;
  if (!lines.length)
    return (
      <div className="container-page py-14">
        <EmptyBag />
      </div>
    );

  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display mb-8 text-[32px] font-bold md:text-[48px]">Checkout</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8" aria-describedby="demo-notice">
          {submitCount > 0 && errorList.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-sm)] border border-danger bg-surface p-4">
              <p className="font-semibold text-danger">Please fix {errorList.length === 1 ? "1 field" : `${errorList.length} fields`}:</p>
              <ul className="mt-2 list-disc pl-5 text-[14px]">
                {errorList.map(([name, err]) => (
                  <li key={name}>
                    <a href={`#f-${name}`} className="underline">{err.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <fieldset className="grid gap-4 md:grid-cols-2" disabled={isSubmitting}>
            <legend className="font-display mb-2 text-[20px] font-bold">Contact &amp; shipping</legend>
            {FIELDS.map((f) => (
              <div key={f.name} className={f.name === "address" || f.name === "full_name" ? "md:col-span-2" : undefined}>
                <label htmlFor={`f-${f.name}`} className="mb-1 block text-[14px] font-medium">
                  {f.label} <span aria-hidden className="text-danger">*</span>
                </label>
                <input
                  id={`f-${f.name}`}
                  type={f.type ?? "text"}
                  autoComplete={f.autoComplete}
                  aria-invalid={!!errors[f.name] || undefined}
                  aria-describedby={errors[f.name] ? `e-${f.name}` : undefined}
                  aria-required
                  {...register(f.name)}
                  className="h-12 w-full rounded-[var(--radius-sm)] border border-ink-soft/60 bg-surface px-4 text-[16px] aria-[invalid=true]:border-danger"
                />
                {errors[f.name] && (
                  <p id={`e-${f.name}`} className="mt-1 text-[13px] text-danger">{errors[f.name]?.message}</p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="f-country" className="mb-1 block text-[14px] font-medium">
                Country <span aria-hidden className="text-danger">*</span>
              </label>
              <select
                id="f-country"
                autoComplete="country-name"
                {...register("country")}
                className="h-12 w-full rounded-[var(--radius-sm)] border border-ink-soft/60 bg-surface px-3 text-[16px]"
              >
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </fieldset>

          <div id="demo-notice" className="flex gap-3 rounded-[var(--radius-sm)] bg-denim-100 p-4 text-[14px]">
            <Info className="size-5 shrink-0 text-denim-700" aria-hidden />
            <p><strong>Demo store, no payment is taken.</strong> Placing your order sends a request only. Nothing is charged or shipped.</p>
          </div>

          {serverError && (
            <p role="alert" className="rounded-[var(--radius-sm)] border border-danger bg-surface p-4 text-[14px] text-danger">{serverError}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full md:w-auto md:self-start">
            Place order request
          </Button>
        </form>

        <aside className="h-fit rounded-[var(--radius-lg)] bg-surface p-6" aria-label="Order summary">
          <h2 className="font-display mb-4 text-[20px] font-bold">Your order</h2>
          <ul className="flex flex-col gap-4">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 text-[14px]">
                {l.imagePath && <img src={imageUrl(l.imagePath, 640)} alt="" className="aspect-[4/5] w-14 bg-plinth object-cover" />}
                <div className="flex-1">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-ink-soft">{l.size} · Qty {l.qty}</p>
                </div>
                <span className="tnum font-semibold">{formatPrice(l.priceCents * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between border-t border-line pt-4 text-[16px] font-semibold">
            <span>Subtotal</span>
            <span className="tnum">{formatPrice(cartSubtotal(lines))}</span>
          </div>
          <p className="mt-2 text-[13px] text-ink-soft">Final prices are confirmed by the store when it reviews your request.</p>
        </aside>
      </div>
    </div>
  );
}
