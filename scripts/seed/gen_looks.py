"""Pre-generate AI Stylist looks with the local Llama model for the live demo (AI_MODE=demo, D-007).

Reads published products through the public REST API (publishable key, RLS-protected reads),
asks llama3.1:8b for 3 looks per product using the same prompt as the app (src/lib/ai/prompts/looks-v1.json),
validates JSON + whitelists ids, and writes supabase/seed/ai_looks.json + ai_looks.sql for review and seeding.

Run: OLLAMA_NUM_GPU=0 python scripts/seed/gen_looks.py
"""
import json, os, random, sys, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SUPA = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://cbzjbfklfegvxmbsrfcw.supabase.co")
KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_fzzgZdLUzysPbofwMPDaMQ_8gdeQrRu")
MODEL = os.environ.get("AI_MODEL", "llama3.1:8b")
OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434") + "/api/chat"
PROMPT = json.load(open(os.path.join(ROOT, "src", "lib", "ai", "prompts", "looks-v2.json"), encoding="utf-8"))
OUT_JSON = os.path.join(ROOT, "supabase", "seed", "ai_looks.json")
random.seed(3)

def rest(path):
    req = urllib.request.Request(f"{SUPA}/rest/v1/{path}", headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

products = rest("products?select=id,slug,name,price_cents,categories(slug),product_colors(name),product_variants(stock)&status=eq.published")
for p in products:
    p["cat"] = p["categories"]["slug"]
    p["colour"] = (p["product_colors"] or [{"name": ""}])[0]["name"]
    p["stock"] = sum(v["stock"] for v in p["product_variants"])

# Outfit rules: mirror of src/lib/ai/outfit.ts
import re
SLOT_RULES = [(r"\bdress\b", "dress"), (r"\b(jacket|blazer|coat|trucker)\b", "outerwear"), (r"\b(tee|top|hoodie|shirt|sweat)", "top"),
              (r"\b(chino|pant|trouser|jean|short|skirt)", "bottom"), (r"\b(cap|beanie|hat)\b", "headwear"), (r"\bsunglasses\b", "eyewear"),
              (r"\bsocks?\b", "socks"), (r"\b(chain|necklace|bracelet|ring)\b", "jewellery")]
def slot_of(name, cat):
    if cat == "shoes": return "shoes"
    if cat == "bags": return "bag"
    for rx, sl in SLOT_RULES:
        if re.search(rx, name, re.I): return sl
    return "other"
def conflicts(sl):
    if sl == "dress": return {"dress", "top", "bottom"}
    if sl in ("top", "bottom"): return {sl, "dress"}
    return set() if sl == "other" else {sl}
def repair(anchor_slot, ids, slot_by_id):
    blocked, kept = set(conflicts(anchor_slot)), []
    for i in ids:
        sl = slot_by_id[i]
        if sl in blocked: continue
        kept.append(i); blocked |= conflicts(sl)
    return kept
COLOURS = ["black", "white", "off-white", "cream", "beige", "sand", "stone", "grey", "gray", "navy", "blue", "cobalt", "denim", "teal", "green", "olive",
           "yellow", "gold", "orange", "rust", "red", "terracotta", "brown", "tan", "chestnut", "cognac", "kraft", "honey", "lilac", "purple", "pink", "amber", "gum"]

FAMILIES = {"chestnut": "brown", "cognac": "brown tan", "tan": "brown", "honey": "brown tan", "kraft": "brown", "dark brown": "brown",
            "navy": "blue", "cobalt": "blue", "denim": "blue", "light wash": "blue denim", "teal": "blue green", "olive": "green",
            "rust": "orange red", "terracotta": "orange red rust", "lilac": "purple", "gold": "yellow", "sun yellow": "yellow",
            "stone": "beige neutral", "sand": "beige neutral", "cream": "off-white white", "off-white": "cream white", "beige": "sand",
            "heather grey": "grey gray", "gunmetal": "grey gray", "amber": "orange"}

for p in products:
    p["slot"] = slot_of(p["name"], p["cat"])

def chat(system, user):
    opts = {"temperature": 0.7, "seed": random.randint(1, 10_000)}
    if os.environ.get("OLLAMA_NUM_GPU"):
        opts["num_gpu"] = int(os.environ["OLLAMA_NUM_GPU"])
    body = json.dumps({"model": MODEL, "format": "json", "stream": False, "options": opts,
                       "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}).encode()
    with urllib.request.urlopen(urllib.request.Request(OLLAMA, body, {"Content-Type": "application/json"}), timeout=300) as r:
        return json.loads(json.loads(r.read())["message"]["content"])

def validate(raw, ids, pid, cat_of, anchor=None):
    looks = raw.get("looks") if isinstance(raw, dict) else None
    if not isinstance(looks, list) or not looks:
        return None, "missing looks array"
    out = []
    for l in looks[:3]:
        t, r, items = str(l.get("title", "")).strip(), str(l.get("rationale", "")).strip(), l.get("item_ids", [])
        if not (2 <= len(t) <= 60) or not (10 <= len(r) <= 200) or not isinstance(items, list):
            return None, "title 2-60 chars, rationale 10-200 chars, item_ids array"
        clean = []
        for i in items:
            i = str(i)
            if i in ids and i != pid and i not in clean:
                clean.append(i)
        clean = repair(anchor["slot"], clean, slot_by)
        if len(clean) < 2:
            return None, "each look needs at least 2 item_ids copied exactly from the candidate list"
        allowed = (anchor["colour"] + " " + " ".join(by_id[i]["colour"] + " " + by_id[i]["name"] for i in clean[:4])).lower()
        for k, fam in FAMILIES.items():
            if k in allowed: allowed += " " + fam
        bad = [c for c in COLOURS if re.search(rf"\b{c}\b", r.lower()) and c not in allowed]
        if bad:
            return None, f"the rationale mentions colours ({', '.join(bad)}) that are not the listed colours of the product or the chosen items"
        if any(by_id[i]["name"].lower() in t.lower() for i in clean) or anchor["name"].lower() in t.lower():
            return None, "titles must not contain product names"
        out.append({"title": t, "rationale": r, "item_ids": clean[:4]})
    if len(out) < 3:
        return None, "return exactly 3 looks"
    return out, None

done = json.load(open(OUT_JSON, encoding="utf-8")) if os.path.exists(OUT_JSON) else {}
done = {k: v for k, v in done.items() if v.get("prompt_version") == PROMPT["version"]}  # regenerate older prompt versions
cat_of = {p["id"]: p["cat"] for p in products}
by_id = {p["id"]: p for p in products}
slot_by = {p["id"]: p["slot"] for p in products}
for p in products:
    if p["slug"] in done:
        continue
    cands = [c for c in products if c["id"] != p["id"] and c["stock"] > 0 and c["slot"] not in conflicts(p["slot"])]
    random.shuffle(cands)
    cands = cands[:28]
    ids = {c["id"] for c in cands}
    lines = "\n".join(f"{c['id']} | {c['name']} | {c['slot']} | {c['colour']}" for c in cands)
    user = (PROMPT["user_template"].replace("{name}", p["name"]).replace("{slot}", p["slot"])
            .replace("{colour}", p["colour"]).replace("{price}", f"{p['price_cents']/100:.2f}").replace("{candidates}", lines))
    looks, err = None, None
    for attempt in range(4):
        try:
            looks, err = validate(chat(PROMPT["system"], user + (f"\n\nYour previous answer was invalid: {err}. Fix it." if err else "")), ids, p["id"], cat_of, p)
        except Exception as e:  # network / JSON errors
            err = f"invalid JSON ({type(e).__name__})"
        if looks:
            break
    if not looks:
        print("FAILED", p["slug"], err, flush=True)
        continue
    done[p["slug"]] = {"product_id": p["id"], "prompt_version": PROMPT["version"], "looks": looks}
    json.dump(done, open(OUT_JSON, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("ok", p["slug"], "|", " / ".join(l["title"] for l in looks), flush=True)

# SQL for seeding (upsert by product_id + look_index)
rows = []
for slug, v in done.items():
    for i, l in enumerate(v["looks"], 1):
        t, r = l["title"].replace("'", "''"), l["rationale"].replace("'", "''")
        arr = "array[" + ",".join(f"'{x}'::uuid" for x in l["item_ids"]) + "]"
        rows.append(f"('{v['product_id']}', {i}, '{t}', '{r}', {arr}, '{MODEL}', '{PROMPT['version']}')")
sql = ("insert into public.ai_looks (product_id, look_index, title, rationale, item_product_ids, model, prompt_version) values\n"
       + ",\n".join(rows) + "\non conflict (product_id, look_index) do update set title = excluded.title, rationale = excluded.rationale, "
       "item_product_ids = excluded.item_product_ids, model = excluded.model, prompt_version = excluded.prompt_version, generated_at = now();\n")
open(os.path.join(ROOT, "supabase", "seed", "ai_looks.sql"), "w", encoding="utf-8").write(sql)
print("products with looks:", len(done), "of", len(products))
