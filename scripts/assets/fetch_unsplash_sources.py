import json, csv, subprocess, os, sys
sys.stdout.reconfigure(encoding="utf-8")
db = json.load(open(os.path.join(os.path.dirname(__file__),'unsplash_db.json'), encoding='utf-8'))
R = 'D:/ruelook/seed/images'
A = 'approved'; NR = 'needs-review'
# (id, folder, slug, slot, query, product_name, colour, category, status, extra_note)
M = [
('CTj5W3zAU78','campaign','hero-01-lagos-blue','hero-1','The Street Is My Runway Lagos','','','campaign',A,'Landscape; blue outfit by yellow bus; Lagos street portrait'),
('UWxlereXSek','campaign','hero-02-street-leather','hero-2','young african man street portrait','','','campaign',A,'Landscape; leather jacket over denim shirt; blurred pedestrians in background'),
('_K2QlUid8Rg','campaign','hero-03-lagos-walk','hero-3','Lagos street style','','','campaign',A,'Landscape; same model and series as hero-1; neutral sky'),
('2F0kqCaOPEE','campaign','promo-women','promo-women','streetwear model blue background','','','campaign',A,'Portrait; bright blue wall; crop to tile'),
('frgc47WGpZ0','campaign','promo-men','promo-men','streetwear outfit man sky','','','campaign',A,'Portrait; low angle on blue sky; usable as wide crop with sky'),
('KPydzVyWfqg','campaign','promo-shoes','promo-shoes','plain white sneakers studio','','','campaign',A,'Landscape; white sneakers top-down on red carpet; no logo visible'),
('gfaNVKNiSJ4','campaign','promo-bags','promo-bags','backpack studio shot','','','campaign',A,'Portrait; woman with braids and pink backpack; dark red backdrop'),
('qSA-x_pTHqQ','women','linen-rope-belt-dress','product-primary','women clothing white background','Linen Rope-Belt Mini Dress','Off-white','women / dresses',A,''),
('6_LidIGnJqU','women','terracotta-shirt-dress','product-primary','women clothing white background','Tie-Waist Shirt Dress','Terracotta','women / dresses',A,''),
('LVOJU0oCDFA','women','terracotta-shirt-dress-2','product-extra','women clothing white background','Tie-Waist Shirt Dress','Terracotta','women / dresses',A,'Extra (back view) of terracotta-shirt-dress; same series'),
('5HGxv4nigtQ','women','ink-blot-wrap-dress','product-primary','women clothing white background','Ink-Blot Wrap Dress','White / black','women / dresses',A,''),
('3IAdFazpbHM','women','off-shoulder-denim-dress','product-primary','women clothing white background','Off-Shoulder Denim Dress','Light wash blue','women / dresses',A,''),
('x3sKu64xnMM','women','ribbed-crop-tee-lilac','product-primary','women clothing white background','Ribbed Cropped Tee','Lilac','women / tops',A,''),
('h0Tiqq98-kc','women','ribbed-crop-top-orange','product-primary','women clothing white background','Ribbed Crop Top','Orange','women / tops',A,''),
('cG-u9IeCTao','women','faux-fur-jacket','product-primary','woman wearing jacket white background','Faux Fur Cropped Jacket','Honey brown','women / jackets',A,''),
('eIsNtaODSlk','women','faux-fur-jacket-2','product-extra','woman wearing jacket white background','Faux Fur Cropped Jacket','Honey brown','women / jackets',A,'Extra (back view) of faux-fur-jacket; same series'),
('pKXJiV9QA_0','women','faux-fur-jacket-3','product-extra','woman wearing jacket white background','Faux Fur Cropped Jacket','Honey brown','women / jackets',A,'Extra (pose) of faux-fur-jacket; same series'),
('g-Vl9Mom508','women','tailored-blazer-black','product-primary','woman wearing jacket white background','Relaxed Tailored Blazer','Black','women / jackets',A,''),
('QgkvWLlYgXw','women','flutter-sleeve-tee','product-spare','women clothing white background','Flutter-Sleeve Tee','White','women / tops',A,'Spare 9th women item'),
('pYz9vC-3eeo','men','heavyweight-hoodie-black','product-primary','man wearing hoodie studio plain background','Heavyweight Hoodie','Black','men / hoodies',A,''),
('FScEk_nwoRE','men','pullover-hoodie-yellow','product-primary','hoodie mockup plain','Pullover Hoodie','Sun yellow','men / hoodies',A,''),
('bjrSaTRtp2I','men','pullover-hoodie-yellow-2','product-extra','hoodie mockup plain','Pullover Hoodie','Sun yellow','men / hoodies',A,'Extra of pullover-hoodie-yellow; same series'),
('IFuaupIXx98','men','crew-tee-navy','product-primary','man plain t-shirt studio portrait','Essential Crew Tee','Navy','men / tees',A,''),
('8HA25wVZIkY','men','crew-tee-navy-2','product-extra','man plain t-shirt studio portrait','Essential Crew Tee','Navy','men / tees',A,'Extra of crew-tee-navy; same series'),
('GsLxMF4CVJg','men','pocket-tee-heather','product-primary','man plain t-shirt studio portrait','Pocket Tee','Heather grey','men / tees',A,'Dark studio background'),
('t-QhVwc4c2g','men','quilted-jacket-cobalt','product-primary','men jacket flat lay','Quilted Zip Jacket','Cobalt blue','men / jackets',A,''),
('LdekusMFSsA','men','denim-trucker-jacket','product-primary','jacket white background','Denim Trucker Jacket','Light wash','men / jackets',A,'Flat lay also shows matching jeans; crop to jacket'),
('lLTa7me6AK4','men','slim-chino-stone','product-primary','men trousers product white background','Slim Chino','Stone','men / pants',A,''),
('Opphq-27mkQ','men','slim-chino-stone-2','product-extra','men trousers product white background','Slim Chino','Stone','men / pants',A,'Extra of slim-chino-stone; same series'),
('Kk0i7djqcCA','men','slim-chino-stone-3','product-extra','men trousers product white background','Slim Chino','Stone','men / pants',A,'Extra of slim-chino-stone; same series'),
('5JoEv-ijeyc','men','cargo-pant-olive','product-primary','cargo pants','Utility Cargo Pant','Olive','men / pants',A,'Dark studio background; not plinth-ready'),
('esxf7PJmExQ','shoes','cap-toe-lace-boot','product-primary','leather boots product photo','Cap-Toe Lace-Up Boot','Dark brown','shoes / boots',A,''),
('WV5kz6g5sFs','shoes','cap-toe-lace-boot-2','product-extra','leather boots product photo','Cap-Toe Lace-Up Boot','Dark brown','shoes / boots',A,'Extra of cap-toe-lace-boot; same series'),
('818_HSWlayI','shoes','cap-toe-lace-boot-3','product-extra','leather boots product photo','Cap-Toe Lace-Up Boot','Dark brown','shoes / boots',A,'Extra of cap-toe-lace-boot; same series'),
('tDHBHyAO-Hw','shoes','slouch-boot-black','product-primary','leather boots product photo','Slouch Heeled Boot','Black','shoes / boots',A,''),
('AwhukWqsfSs','shoes','chelsea-boot-brown','product-primary','leather boots product photo','Chelsea Boot','Chestnut','shoes / boots',A,''),
('ju-B5nlGXzE','shoes','chelsea-boot-brown-2','product-extra','leather boots product photo','Chelsea Boot','Chestnut','shoes / boots',A,'Extra of chelsea-boot-brown; same series'),
('_D7x0SJjiSs','shoes','chelsea-boot-black','product-primary','leather boots product photo','Chelsea Boot','Black','shoes / boots',A,'Dark background'),
('nxlF27TJQTk','shoes','brogue-boot-tan','product-primary','leather boots product photo','Brogue Ankle Boot','Tan','shoes / boots',A,'Dark background'),
('j3zyp_i9lfI','shoes','combat-boot-brown','product-primary','leather boots product photo','Lace-Up Combat Boot','Brown','shoes / boots',A,'Very dark low-key photo'),
('Q3nFCix-IA8','shoes','canvas-low-red','product-primary','canvas shoes','Canvas Low-Top Sneaker','Red','shoes / sneakers',A,'Shop-window background; no logo visible'),
('EgN1AQ37AuU','shoes','suede-court-gum','product-primary','minimal white leather sneakers','Suede Court Sneaker','Off-white / gum','shoes / sneakers',NR,'Tiny unreadable gold stamp near heel; retouch or confirm before use'),
('0eGu-6y4qOU','bags','leather-rucksack','product-primary','backpack','Leather Flap Rucksack','Cognac','bags / backpacks',A,''),
('1Pgq9ZpIatI','bags','kraft-tote','product-primary','tote bag mockup','Coated Kraft Tote','Kraft brown','bags / totes',A,''),
('6Rh4vvSaiSg','bags','canvas-tote-sand','product-primary','canvas tote bag','Everyday Canvas Tote','Sand','bags / totes',A,''),
('6WZtlK0Ez6w','bags','canvas-tote-sand-2','product-extra','canvas tote bag','Everyday Canvas Tote','Sand','bags / totes',A,'Extra of canvas-tote-sand; same series'),
('kTozgN5CQHc','bags','leather-messenger','product-primary','crossbody bag','Leather Utility Messenger','Tan','bags / crossbody',A,''),
('hLwkfi3oPp0','bags','leather-messenger-2','product-extra','crossbody bag','Leather Utility Messenger','Tan','bags / crossbody',A,'Extra of leather-messenger; same series'),
('J4DnKxz_3sA','bags','mini-satchel-grey','product-primary','crossbody bag','Mini Buckle Satchel','Grey','bags / crossbody',A,''),
('iz1Y0EtTN1c','bags','zip-belt-bag-black','product-primary','crossbody bag','Zip Belt Bag','Black','bags / crossbody',A,''),
('FYWNzQnXgsk','bags','barrel-shoulder-bag','product-primary','crossbody bag','Barrel Shoulder Bag','Beige','bags / crossbody',A,'Warm tan studio background'),
('SNPDQAE4EHY','bags','half-moon-sling','product-primary','crossbody bag','Half-Moon Sling Bag','Cream','bags / crossbody',A,'On-body lifestyle shot'),
('DT7ercyDWjs','accessories','blank-cap-white','product-primary','blank cap mockup','Five-Panel Cap','White','accessories / caps',A,''),
('91i-pLiqahg','accessories','pom-beanie-rust','product-primary','knit beanie hat','Chunky Pom Beanie','Rust orange','accessories / beanies',A,''),
('1YJSLklwaUk','accessories','pom-beanie-rust-2','product-extra','knit beanie hat','Chunky Pom Beanie','Rust orange','accessories / beanies',A,'Extra of pom-beanie-rust; same series'),
('e0mkwiV22Mk','accessories','chunky-beanie-teal','product-primary','knit beanie hat','Chunky Rib Beanie','Teal','accessories / beanies',A,''),
('lSl94SZHRgA','accessories','browline-sunglasses','product-primary','sunglasses','Browline Sunglasses','Black / gunmetal','accessories / sunglasses',A,''),
('MihqwlJXx0M','accessories','shield-sunglasses-amber','product-primary','sunglasses','Shield Sunglasses','Black / amber mirror','accessories / sunglasses',A,''),
('YHmZBuNCLvQ','accessories','textured-socks-trio','product-primary','colorful socks','Textured Crew Socks (3-pack)','Grey / purple / yellow','accessories / socks',A,''),
('Z3GHeY0NXGg','accessories','cuban-chain-gold','product-primary','gold chain necklace jewelry','Cuban Link Chain','Gold tone','accessories / jewellery',A,''),
('i1B8PtxYmoY','accessories','fine-chain-set-gold','product-primary','gold chain necklace jewelry','Fine Chain Necklace Set','Gold tone','accessories / jewellery',A,''),
]
rows = []
for (i, f, slug, slot, q, pn, col, cat, st, extra) in M:
    d = db[i]; base = d['raw'].split('?')[0]
    url = base + '?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600'
    os.makedirs(f'{R}/{f}', exist_ok=True); out = f'{R}/{f}/{slug}.jpg'
    if not os.path.exists(out) or os.path.getsize(out) < 10000:
        subprocess.run(['curl', '-sSL', '-o', out, url], check=True)
    local = f'seed/images/{f}/{slug}.jpg'
    notes = f"alt: {d['alt']}; unsplash_id: {i}; file: {local}"
    if pn: notes += f"; product: {pn}; colour: {col}; category: {cat}"
    if extra: notes += f"; {extra}"
    notes += "; licence: no selling unmodified copies; no compiling into a competing/similar service; Unsplash gives no trademark/model-release clearance"
    rows.append([slug, 'photo', slot, q, 'Unsplash', f'https://unsplash.com/photos/{i}', d['name'], 'Unsplash License', 'https://unsplash.com/license', 'yes', 'yes', 'no', f"Photo by {d['name']} on Unsplash", '2026-11-25', st, notes])
with open('D:/ruelook/docs/design/asset-register.csv', 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh)
    w.writerow('asset_name,asset_type,slot,search_query,source_library,source_url,creator,license,license_url,commercial_use,modification_allowed,attribution_required,attribution_text,date_checked,status,notes'.split(','))
    w.writerows(rows)
print(len(rows))
