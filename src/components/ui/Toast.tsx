"use client";

import { create } from "zustand";
import { useEffect } from "react";

interface Toast {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  /** Polite screen-reader announcement without a visible toast. */
  announcement: string;
  show: (message: string, action?: Toast["action"]) => void;
  announce: (message: string) => void;
  dismiss: (id: number) => void;
}

let seq = 0;
export const useToast = create<ToastState>((set) => ({
  toasts: [],
  announcement: "",
  show: (message, action) => set((s) => ({ toasts: [...s.toasts.slice(-2), { id: ++seq, message, action }], announcement: message })),
  announce: (message) => set({ announcement: message }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useToast((s) => s.dismiss);
  useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), 5000);
    return () => clearTimeout(id);
  }, [t.id, dismiss]);
  return (
    <div className="on-dark pointer-events-auto flex items-center gap-4 rounded-[var(--radius-sm)] bg-ink px-4 py-3 text-[14px] text-white shadow-[var(--shadow-drawer)]">
      <span>{t.message}</span>
      {t.action && (
        <button
          type="button"
          className="font-semibold underline underline-offset-4"
          onClick={() => {
            t.action?.onClick();
            dismiss(t.id);
          }}
        >
          {t.action.label}
        </button>
      )}
    </div>
  );
}

export function ToastRegion() {
  const toasts = useToast((s) => s.toasts);
  const announcement = useToast((s) => s.announcement);
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} />
        ))}
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
}
