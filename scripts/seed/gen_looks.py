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
PROMPT = json.load(open(os.path.join(ROOT, "src", "lib", "ai", "prompts", "looks-v1.json"), encoding="utf-8"))
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

def chat(system, user):
    opts = {"temperature": 0.7, "seed": random.randint(1, 10_000)}
    if os.environ.get("OLLAMA_NUM_GPU"):
        opts["num_gpu"] = int(os.environ["OLLAMA_NUM_GPU"])
    body = json.dumps({"model": MODEL, "format": "json", "stream": False, "options": opts,
                       "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}).encode()
    with urllib.request.urlopen(urllib.request.Request(OLLAMA, body, {"Content-Type": "application/json"}), timeout=300) as r:
        return json.loads(json.loads(r.read())["message"]["content"])

def validate(raw, ids, pid, cat_of):
    looks = raw.get("looks") if isinstance(raw, dict) else None
    if not isinstance(looks, list) or not looks:
        return None, "missing looks array"
    out = []
    for l in looks[:3]:
        t, r, items = str(l.get("title", "")).strip(), str(l.get("rationale", "")).strip(), l.get("item_ids", [])
        if not (2 <= len(t) <= 60) or not (10 <= len(r) <= 200) or not isinstance(items, list):
            return None, "title 2-60 chars, rationale 10-200 chars, item_ids array"
        clean, seen_cats = [], set()
        for i in items:
            i = str(i)
            if i in ids and i != pid and i not in clean:
                c = cat_of[i]
                if c in ("shoes", "bags") and c in seen_cats:
                    continue  # at most one pair of shoes / one bag
                seen_cats.add(c)
                clean.append(i)
        if len(clean) < 2:
            return None, "each look needs at least 2 item_ids copied exactly from the candidate list"
        out.append({"title": t, "rationale": r, "item_ids": clean[:4]})
    if len(out) < 3:
        return None, "return exactly 3 looks"
    return out, None

done = json.load(open(OUT_JSON, encoding="utf-8")) if os.path.exists(OUT_JSON) else {}
cat_of = {p["id"]: p["cat"] for p in products}
for p in products:
    if p["slug"] in done:
        continue
    cands = [c for c in products if c["cat"] != p["cat"] and c["stock"] > 0]
    random.shuffle(cands)
    cands = cands[:28]
    ids = {c["id"] for c in cands}
    lines = "\n".join(f"{c['id']} | {c['name']} | {c['cat']} | {c['colour']}" for c in cands)
    user = (PROMPT["user_template"].replace("{name}", p["name"]).replace("{category}", p["cat"]).replace("{sub}", p["cat"])
            .replace("{colour}", p["colour"]).replace("{price}", f"{p['price_cents']/100:.2f}").replace("{candidates}", lines))
    looks, err = None, None
    for attempt in range(3):
        try:
            looks, err = validate(chat(PROMPT["system"], user + (f"\n\nYour previous answer was invalid: {err}. Fix it." if err else "")), ids, p["id"], cat_of)
        except Exception as e:  # network / JSON errors
            err = f"invalid JSON ({type(e).__name__})"
        if looks:
            break
    if not looks:
        print("FAILED", p["slug"], err, flush=True)
        continue
    done[p["slug"]] = {"product_id": p["id"], "looks": looks}
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
