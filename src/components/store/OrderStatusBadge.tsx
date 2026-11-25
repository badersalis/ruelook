import clsx from "clsx";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";

const TONE: Record<OrderStatus, string> = {
  requested: "bg-signal/30 text-ink",
  confirmed: "bg-denim-100 text-denim-700",
  shipped: "bg-denim-700 text-white",
  completed: "bg-success/15 text-success",
  cancelled: "bg-plinth text-ink-soft",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx("eyebrow inline-flex rounded-[var(--radius-pill)] px-2.5 py-1", TONE[status])}>{STATUS_LABEL[status]}</span>
  );
}
