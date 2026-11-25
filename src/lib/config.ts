/**
 * Public runtime configuration. Every value here ships to the browser.
 * The Supabase URL and publishable key are public by design: Row Level Security is the
 * security boundary (docs/architecture/system-overview.md). Env vars override the defaults.
 * Never put the service-role key here.
 */
export const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cbzjbfklfegvxmbsrfcw.supabase.co",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_fzzgZdLUzysPbofwMPDaMQ_8gdeQrRu",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  aiMode: (process.env.NEXT_PUBLIC_AI_MODE === "local" ? "local" : "demo") as "local" | "demo",
  aiBaseUrl: process.env.NEXT_PUBLIC_AI_BASE_URL || "http://localhost:11434",
  aiModel: process.env.NEXT_PUBLIC_AI_MODEL || "llama3.1:8b",
  aiNumGpu: process.env.NEXT_PUBLIC_AI_NUM_GPU ? Number(process.env.NEXT_PUBLIC_AI_NUM_GPU) : undefined,
  aiTimeoutMs: Number(process.env.NEXT_PUBLIC_AI_TIMEOUT_MS) || 20_000,
  storageBucket: "product-images",
} as const;

/** Resolve an image path from product_images.path to a URL.
 *  `static/...` → bundled WebP derivative in /public (seed data, D-011), else a Storage object key. */
export function imageUrl(path: string, width: 640 | 1200 = 640): string {
  if (path.startsWith("static/")) return `${config.basePath}/${path.slice(7)}-${width}.webp`;
  return `${config.supabaseUrl}/storage/v1/object/public/${config.storageBucket}/${path}`;
}

export function assetUrl(path: string): string {
  return `${config.basePath}/${path.replace(/^\//, "")}`;
}
