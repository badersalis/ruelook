"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { flushPendingWishlist } from "@/lib/wishlist";
import { Button } from "@/components/ui/Button";

function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "That email or password doesn't match.";
  if (m.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many emails sent recently. Wait a few minutes and try again.";
  if (m.includes("password")) return "Use a password with at least 8 characters.";
  if (m.includes("email not confirmed")) return "Confirm your email first: check your inbox for the link.";
  return "Something went wrong. Try again.";
}

/** Only allow same-site relative paths as post-login destinations. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/account/";
  return next;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const reason = params.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"password" | "magic" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const redirectTo = () => `${window.location.origin}${config.basePath}${next}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    setBusy("password");
    const res =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: redirectTo() } });
    setBusy(null);
    if (res.error) return setError(friendly(res.error.message));
    if (!res.data.session) return setInfo("Check your inbox to confirm your email, then sign in.");
    await flushPendingWishlist(res.data.session.user.id);
    router.replace(next);
  };

  const magic = async () => {
    setError(null);
    setInfo(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter your email first.");
    setBusy("magic");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setBusy(null);
    if (error) return setError(friendly(error.message));
    setInfo("Magic link sent. Open it on this device to sign in.");
  };

  return (
    <div className="container-page flex max-w-md flex-col gap-6 py-16">
      <h1 className="font-display text-[32px] font-bold">{mode === "login" ? "Sign in" : "Create an account"}</h1>
      {reason === "wishlist" && <p className="rounded-[var(--radius-sm)] bg-denim-100 p-3 text-[14px]">Sign in to save pieces to your wishlist.</p>}
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="a-name" className="mb-1 block text-[14px] font-medium">Full name</label>
            <input id="a-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-[var(--radius-sm)] border border-ink-soft/60 bg-surface px-4 text-[16px]" />
          </div>
        )}
        <div>
          <label htmlFor="a-email" className="mb-1 block text-[14px] font-medium">Email</label>
          <input id="a-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-[var(--radius-sm)] border border-ink-soft/60 bg-surface px-4 text-[16px]" />
        </div>
        <div>
          <label htmlFor="a-pass" className="mb-1 block text-[14px] font-medium">Password</label>
          <div className="relative">
            <input
              id="a-pass"
              type={show ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="a-pass-hint"
              className="h-12 w-full rounded-[var(--radius-sm)] border border-ink-soft/60 bg-surface px-4 pr-12 text-[16px]"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-0 top-0 grid size-12 place-items-center" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
              {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
            </button>
          </div>
          <p id="a-pass-hint" className="mt-1 text-[13px] text-ink-soft">At least 8 characters.</p>
        </div>
        {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
        {info && <p role="status" className="rounded-[var(--radius-sm)] bg-denim-100 p-3 text-[14px]">{info}</p>}
        <Button type="submit" loading={busy === "password"}>{mode === "login" ? "Sign in" : "Create account"}</Button>
      </form>
      {mode === "login" && (
        <Button variant="secondary" onClick={magic} loading={busy === "magic"}>Email me a magic link</Button>
      )}
      <p className="text-[14px] text-ink-soft">
        {mode === "login" ? (
          <>New here? <Link href={`/account/signup/?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href={`/account/login/?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline">Sign in</Link></>
        )}
      </p>
      <p className="text-[12px] text-ink-soft">Demo note: sign-up emails use Supabase&apos;s built-in sender, which is rate-limited to a few emails per hour.</p>
    </div>
  );
}
