"""Generate product descriptions + material/care with the local Llama model (Ollama).

Run: python scripts/seed/gen_copy.py   (needs Ollama at localhost:11434 with llama3.1:8b)
Fills empty description/material_care fields in supabase/seed/catalog.json. Output is reviewed by the
Delivery Lead before seeding (local-llm skill: review generated content).
"""
import json, os, sys, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P = os.path.join(ROOT, "supabase", "seed", "catalog.json")
MODEL = os.environ.get("AI_MODEL", "llama3.1:8b")
URL = os.environ.get("OLLAMA_URL", "http://localhost:11434") + "/api/chat"
PROMPT_VERSION = "copy-v1"

SYSTEM = """You write product copy for Ruelook, an editorial streetwear store. Voice: confident, concise, concrete, no hype words (no "elevate", "must-have", "game-changer"), no brand names, no claims about origin, certifications or sustainability.
Return JSON only: {"description": string (2 sentences, 25-45 words, how it looks, fits and how to wear it), "material_care": string (one line: plausible material composition, then care, e.g. "100% cotton jersey. Machine wash cold, dry flat.")}"""

def ask(prod, retry_note=""):
    user = (f"Product: {prod['name']}\nColour: {prod['colour']}\nCategory: {prod['category']} / {prod['sub']}\n"
            f"Price: ${prod['price_cents']/100:.2f}\n{retry_note}")
    body = json.dumps({"model": MODEL, "format": "json", "stream": False,
                       "options": {"temperature": 0.6, "seed": 11, **({"num_gpu": int(os.environ["OLLAMA_NUM_GPU"])} if os.environ.get("OLLAMA_NUM_GPU") else {})},
                       "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}]}).encode()
    req = urllib.request.Request(URL, body, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(json.loads(r.read())["message"]["content"])

BANNED = ["elevate", "must-have", "game-changer", "nike", "adidas", "sustainab", "organic", "certified"]

def valid(o):
    if not isinstance(o, dict): return "not an object"
    d, m = o.get("description", ""), o.get("material_care", "")
    if not (15 <= len(d.split()) <= 60): return f"description has {len(d.split())} words, need 25-45"
    if not (3 <= len(m.split()) <= 25): return "material_care must be one short line"
    low = (d + m).lower()
    for b in BANNED:
        if b in low: return f"remove the word '{b}'"
    return None

data = json.load(open(P, encoding="utf-8"))
done = 0
for p in data["products"]:
    if p.get("description"): continue
    o = ask(p); err = valid(o)
    if err:
        o = ask(p, f"Your previous answer was invalid: {err}. Fix it."); err = valid(o)
    if err:
        print("FAILED", p["slug"], err); continue
    p["description"], p["material_care"] = o["description"].strip(), o["material_care"].strip()
    p["copy_meta"] = {"model": MODEL, "prompt_version": PROMPT_VERSION}
    done += 1
    print("ok", p["slug"], "|", p["description"][:90])
json.dump(data, open(P, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("generated", done)
