"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

/**
 * Native <dialog> modal: focus trap, Esc to close, inert background and focus return come from the platform.
 * variant "drawer" = right side panel (full width on mobile), "sheet" = bottom sheet on mobile / centred on desktop.
 */
export function Dialog({
  open,
  onClose,
  title,
  variant = "drawer",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  variant?: "drawer" | "sheet";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
      className={clsx(
        "rl-dialog m-0 max-h-none max-w-none bg-surface p-0 text-ink shadow-[var(--shadow-drawer)] backdrop:bg-ink/40",
        variant === "drawer"
          ? "rl-drawer ml-auto h-dvh w-full md:w-[420px]"
          : "rl-sheet mt-auto w-full rounded-t-[var(--radius-lg)] md:m-auto md:max-w-[480px] md:rounded-[var(--radius-lg)]",
      )}
    >
      {open && (
        <div className="flex h-full max-h-dvh flex-col">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-[20px] font-bold">{title}</h2>
            <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-plinth" aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="border-t border-line px-5 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
