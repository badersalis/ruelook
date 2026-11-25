import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type OrderStatus = Tables<"orders">["status"];
export type OrderRow = Tables<"orders"> & { order_items: Tables<"order_items">[] };

export const STATUS_LABEL: Record<OrderStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Allowed admin transitions (mirrors admin_set_order_status in SQL). */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

const ORDER_SELECT = "*, order_items(*)";

/** RLS limits this to the caller's own orders (or all, for admins). */
export async function listOrders(opts: { status?: OrderStatus | null; mine?: string } = {}): Promise<OrderRow[]> {
  let q = supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(100);
  if (opts.mine) q = q.eq("user_id", opts.mine);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as OrderRow[];
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as OrderRow | null;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}
