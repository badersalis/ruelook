/**
 * Deterministic outfit rules applied to AI Stylist output (prompt looks-v2).
 * A small local model mixes dresses with trousers or picks two beanies; these rules repair that
 * by keeping the first compatible item per slot. Mirrored in scripts/seed/gen_looks.py.
 */
export type Slot = "dress" | "top" | "outerwear" | "bottom" | "shoes" | "bag" | "headwear" | "eyewear" | "socks" | "jewellery" | "other";

const RULES: [RegExp, Slot][] = [
  [/\bdress\b/i, "dress"],
  [/\b(jacket|blazer|coat|trucker)\b/i, "outerwear"],
  [/\b(tee|top|hoodie|shirt|sweat)/i, "top"],
  [/\b(chino|pant|trouser|jean|short|skirt)/i, "bottom"],
  [/\b(cap|beanie|hat)\b/i, "headwear"],
  [/\bsunglasses\b/i, "eyewear"],
  [/\bsocks?\b/i, "socks"],
  [/\b(chain|necklace|bracelet|ring)\b/i, "jewellery"],
];

export function slotOf(name: string, category: string): Slot {
  if (category === "shoes") return "shoes";
  if (category === "bags") return "bag";
  for (const [re, slot] of RULES) if (re.test(name)) return slot;
  return "other";
}

/** Slots that can't be worn together with a given slot. */
function conflicts(slot: Slot): Slot[] {
  if (slot === "dress") return ["dress", "top", "bottom"];
  if (slot === "top" || slot === "bottom") return [slot, "dress"];
  if (slot === "other") return [];
  return [slot];
}

/** Keep items in order while they fit with the anchor and the items already kept. */
export function repairOutfit<T>(anchorSlot: Slot, items: T[], slotOfItem: (item: T) => Slot): T[] {
  const blocked = new Set<Slot>(conflicts(anchorSlot));
  const kept: T[] = [];
  for (const item of items) {
    const s = slotOfItem(item);
    if (blocked.has(s)) continue;
    kept.push(item);
    for (const c of conflicts(s)) blocked.add(c);
  }
  return kept;
}

/** Candidates worth offering the model for this anchor (pre-filter conflicting slots). */
export function compatibleWith(anchorSlot: Slot, slot: Slot): boolean {
  return !conflicts(anchorSlot).includes(slot);
}
