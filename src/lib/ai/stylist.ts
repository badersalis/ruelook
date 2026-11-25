/**
 * AI Stylist adapter (local-llm skill). Two modes:
 * - demo  (live GitHub Pages): looks are read from Supabase `ai_looks`, pre-generated locally (D-007).
 * - local (npm run dev): the browser calls Ollama directly; output is validated and ids are whitelisted.
 */
import { z } from "zod";
import { config } from "@/lib/config";
import { getLooks, listProducts } from "@/lib/queries";
import type { Look, ProductSummary } from "@/lib/types";
import prompt from "./prompts/looks-v1.json";

export const looksSchema = z.object({
  looks: z
    .array(
      z.object({
        title: z.string().min(2).max(60),
        rationale: z.string().min(10).max(200),
        item_ids: z.array(z.string()).min(2).max(8),
      }),
    )
    .min(1)
    .max(3),
});
export type LooksOutput = z.infer<typeof looksSchema>;

/** Validate model output against the candidate whitelist; returns an error message or the cleaned value. */
export function validateLooks(raw: unknown, candidateIds: Set<string>, productId: string): LooksOutput | string {
  const parsed = looksSchema.safeParse(raw);
  if (!parsed.success) return parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  const looks = parsed.data.looks.map((l) => ({
    ...l,
    item_ids: [...new Set(l.item_ids)].filter((id) => id !== productId && candidateIds.has(id)).slice(0, 4),
  }));
  if (looks.some((l) => l.item_ids.length < 2)) return "each look needs at least 2 item_ids taken from the candidate list";
  return { looks };
}

export function buildPrompt(product: ProductSummary & { colour?: string }, candidates: ProductSummary[]) {
  const lines = candidates.map((c) => `${c.id} | ${c.name} | ${c.category.slug}`).join("\n");
  const user = prompt.user_template
    .replace("{name}", product.name)
    .replace("{category}", product.category.slug)
    .replace("{sub}", product.category.name)
    .replace("{colour}", product.colour ?? "see name")
    .replace("{price}", (product.price_cents / 100).toFixed(2))
    .replace("{candidates}", lines);
  return { system: prompt.system, user };
}

async function callOllama(system: string, user: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(`${config.aiBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model: config.aiModel,
      format: "json",
      stream: false,
      options: { temperature: 0.7 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
  const body = (await res.json()) as { message?: { content?: string } };
  return JSON.parse(body.message?.content ?? "{}");
}

/** Local mode only: generate fresh looks with the local model. 20 s budget (ux-spec), one corrective retry. */
export async function generateLooksLocal(product: ProductSummary): Promise<Look[]> {
  const others = (await listProducts({ limit: 60, excludeId: product.id })).items.filter(
    (p) => p.category.slug !== product.category.slug && p.totalStock > 0,
  );
  const candidates = others.slice(0, 40);
  const ids = new Set(candidates.map((c) => c.id));
  const { system, user } = buildPrompt(product, candidates);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    let result = validateLooks(await callOllama(system, user, ctrl.signal), ids, product.id);
    if (typeof result === "string") {
      result = validateLooks(
        await callOllama(system, `${user}\n\nYour previous answer was invalid: ${result}. Fix it.`, ctrl.signal),
        ids,
        product.id,
      );
    }
    if (typeof result === "string") throw new Error(result);
    const byId = new Map(candidates.map((c) => [c.id, c]));
    return result.looks.map((l, i) => ({
      index: i + 1,
      title: l.title,
      rationale: l.rationale,
      items: l.item_ids.map((id) => byId.get(id)).filter((x): x is ProductSummary => !!x),
    }));
  } finally {
    clearTimeout(timer);
  }
}

/** Demo mode (and the initial render in local mode): stored looks. */
export const fetchStoredLooks = (productId: string) => getLooks(productId);
