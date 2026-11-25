"""Build the Ruelook demo catalogue from the asset register.

Outputs
- public/catalog/<slug>/<n>-{640,1200}.webp  product images (4:5), derived detail crops to reach 3 per product (D-009)
- public/campaign/<name>-{960,1600}.webp      hero/promo images
- supabase/seed/catalog.json                  product records (descriptions filled by gen_copy.py)

Run: python scripts/seed/build_catalog.py
"""
import csv, json, os, re, random, sys
from collections import OrderedDict
from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REG = os.path.join(ROOT, "docs", "design", "asset-register.csv")
OUT_PUBLIC = os.path.join(ROOT, "public")
OUT_JSON = os.path.join(ROOT, "supabase", "seed", "catalog.json")
random.seed(7)

def note_field(notes, key):
    m = re.search(rf"{key}: ([^;]+)", notes)
    return m.group(1).strip() if m else ""

PRICES = {  # USD cents ranges per sub-category
    "dresses": (6800, 12800), "tops": (2800, 4800), "jackets": (11800, 22800),
    "hoodies": (7800, 11800), "tees": (3200, 4800), "pants": (6800, 9800),
    "boots": (14800, 22800), "sneakers": (9800, 13800), "shoes": (9800, 16800),
    "backpacks": (8800, 13800), "totes": (3800, 6800), "bags": (5800, 12800),
    "caps": (2800, 3800), "beanies": (2400, 3400), "sunglasses": (4800, 8800),
    "socks": (1800, 2400), "jewellery": (3800, 7800), "accessories": (2400, 6800),
}
SIZES = {
    "women": ["XS", "S", "M", "L", "XL"],
    "men": ["S", "M", "L", "XL", "XXL"],
    "shoes": ["39", "40", "41", "42", "43", "44", "45", "46"],
    "bags": ["One size"],
}
ACC_SIZES = {"socks": ["S/M", "L/XL"], "jewellery": ["45 cm", "50 cm"]}

def sub_of(cat_full):
    parts = [p.strip() for p in cat_full.split("/")]
    return parts[0], (parts[1] if len(parts) > 1 else parts[0])

def price_for(sub):
    lo, hi = PRICES.get(sub, (3000, 9000))
    p = random.randint(lo // 100, hi // 100) * 100
    return p - 200 if p % 1000 == 0 else p  # x8.00-ish endings

def crop_45(img, zoom=1.0, cy=0.5, cx=0.5):
    w, h = img.size
    tw = min(w, h * 4 / 5) / zoom
    th = tw * 5 / 4
    if th > h / zoom:
        th = h / zoom; tw = th * 4 / 5
    left = max(0, min(w - tw, cx * w - tw / 2))
    top = max(0, min(h - th, cy * h - th / 2))
    return img.crop((int(left), int(top), int(left + tw), int(top + th)))

def save_webp(img, base, widths):
    for wdt in widths:
        im = img.copy()
        if im.width > wdt:
            im = im.resize((wdt, round(im.height * wdt / im.width)), Image.LANCZOS)
        im.save(f"{base}-{wdt}.webp", "WEBP", quality=80, method=6)

def avg_hex(img):
    c = crop_45(img, 2.5).resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    return "#%02X%02X%02X" % c[:3]

def load(path):
    return ImageOps.exif_transpose(Image.open(os.path.join(ROOT, path))).convert("RGB")

# Per-image crop overrides (D-009): exclude the heel stamp on suede-court-gum
OVERRIDES = {"suede-court-gum": {"cy": 0.66}}

rows = list(csv.DictReader(open(REG, encoding="utf-8")))
products = OrderedDict()
campaign = []
for r in rows:
    notes = r["notes"]
    f = note_field(notes, "file")
    if r["slot"].startswith(("hero", "promo")):
        campaign.append({"name": r["asset_name"], "file": f, "alt": note_field(notes, "alt"),
                         "credit": r["attribution_text"]})
        continue
    if r["slot"] == "product-spare":
        continue
    pname = note_field(notes, "product")
    key = (pname, note_field(notes, "colour"))
    if r["slot"] == "product-primary":
        cat, sub = sub_of(note_field(notes, "category"))
        products[key] = {"slug": r["asset_name"], "name": pname, "colour": key[1], "category": cat,
                         "sub": sub, "images": [], "credit": [], "alt": []}
    products.setdefault(key, None)
    if products[key] is None:
        print("orphan extra", r["asset_name"]); continue
    products[key]["images"].append(f)
    products[key]["alt"].append(note_field(notes, "alt"))
    products[key]["credit"].append(r["attribution_text"])

os.makedirs(os.path.join(OUT_PUBLIC, "campaign"), exist_ok=True)
for c in campaign:
    img = load(c["file"])
    save_webp(img, os.path.join(OUT_PUBLIC, "campaign", c["name"]), [960, 1600])
    c["path"] = f"campaign/{c['name']}"

catalog = []
day = 0
for p in products.values():
    if not p: continue
    ov = OVERRIDES.get(p["slug"], {})
    d = os.path.join(OUT_PUBLIC, "catalog", p["slug"])
    os.makedirs(d, exist_ok=True)
    srcs = [load(f) for f in p["images"]]
    views = [crop_45(s, 1.0, cy=ov.get("cy", 0.5), cx=ov.get("cx", 0.5)) for s in srcs]
    alts = [f"{p['name']}, {p['colour'].lower()}" + ("" if i == 0 else f", view {i+1}") for i in range(len(views))]
    if len(views) < 3:
        views.append(crop_45(srcs[0], 1.7, cy=ov.get("cy", 0.42), cx=ov.get("cx", 0.5))); alts.append(f"{p['name']}, {p['colour'].lower()}, detail")
    if len(views) < 3:
        views.append(crop_45(srcs[0], 2.4, cy=ov.get("cy", 0.6), cx=ov.get("cx", 0.5))); alts.append(f"{p['name']}, {p['colour'].lower()}, close-up")
    for i, v in enumerate(views[:4]):
        save_webp(v, os.path.join(d, str(i + 1)), [640, 1200])
    sizes = ACC_SIZES.get(p["sub"]) or SIZES.get(p["category"], ["One size"])
    stock = {}
    for s in sizes:
        r = random.random()
        stock[s] = 0 if r < 0.12 else (random.randint(1, 3) if r < 0.25 else random.randint(4, 24))
    if all(v == 0 for v in stock.values()):
        stock[sizes[len(sizes) // 2]] = 6
    catalog.append({
        "slug": p["slug"], "name": p["name"], "category": p["category"], "sub": p["sub"],
        "colour": p["colour"], "hex": avg_hex(srcs[0]), "price_cents": price_for(p["sub"]),
        "images": [{"path": f"static/catalog/{p['slug']}/{i+1}", "alt": alts[i][:200]} for i in range(min(4, len(views)))],
        "stock": stock, "days_ago": (day := day + random.randint(0, 2)),
        "credits": sorted(set(p["credit"])),
        "description": "", "material_care": "",
    })

# Exactly one product sold out (state coverage for AC-3)
so = next(c for c in catalog if c["category"] == "accessories")
so["stock"] = {k: 0 for k in so["stock"]}

os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
old = {}
if os.path.exists(OUT_JSON):
    old = {c["slug"]: c for c in json.load(open(OUT_JSON, encoding="utf-8"))["products"]}
for c in catalog:  # keep generated copy across rebuilds
    if c["slug"] in old:
        c["description"] = old[c["slug"]].get("description", "")
        c["material_care"] = old[c["slug"]].get("material_care", "")
        c["hex"] = old[c["slug"]].get("hex", c["hex"])  # hand-mapped swatch colours win
json.dump({"campaign": campaign, "products": catalog}, open(OUT_JSON, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
from collections import Counter
print(len(catalog), "products", Counter(c["category"] for c in catalog), len(campaign), "campaign")
