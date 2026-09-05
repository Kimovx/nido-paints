"""Regenerate delivery assets from originals: python scripts/optimize_assets.py (Pillow)."""
import base64
import io
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'optimized'
OUT.mkdir(exist_ok=True)

def save(image, target, width, quality=82):
    image = image.copy()
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, 'WEBP', quality=quality, method=6)
    return image.size

manifest = {}
for source in (ROOT / 'assets').rglob('*'):
    if source.suffix.lower() not in ('.png', '.webp') or OUT in source.parents:
        continue
    relative = source.relative_to(ROOT / 'assets')
    # Unused campaign artwork stays as source material, outside the delivery set.
    if source.name.startswith('campaign-'):
        continue
    widths = [160, 320] if source.stem == 'logo' else ([320, 640] if 'products' in str(relative) else [640, 1280])
    with Image.open(source) as image:
        variants = []
        for width in widths:
            target = OUT / relative.parent / f'{source.stem}-{width}.webp'
            w, h = save(image, target, width)
            variants.append({'src': target.relative_to(ROOT).as_posix(), 'width': w, 'height': h})
        manifest[source.relative_to(ROOT).as_posix()] = variants

animation = json.loads((ROOT / 'hero.json').read_text(encoding='utf-8'))
for asset in animation['assets']:
    if not asset.get('p', '').startswith('data:'):
        continue
    image = Image.open(io.BytesIO(base64.b64decode(asset['p'].split(',', 1)[1])))
    target = OUT / 'hero' / f"{asset['id']}.webp"
    save(image, target, image.width, quality=85)
    asset.update(p=target.name, u='assets/optimized/hero/', e=0)
# A small external script also works when index.html is opened using file://.
(OUT / 'hero-data.js').write_text('window.NIDO_HERO_ANIMATION=' + json.dumps(animation, separators=(',', ':')) + ';', encoding='utf-8')
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('Generated', len(manifest), 'image families; hero data:', (OUT / 'hero-data.js').stat().st_size, 'bytes')
