"""Install one generated illustration at the atlas's existing full/thumbnail sizes."""
import json
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
entry_id, source = sys.argv[1:3]
plan_path = root / 'data/supplemental-art.json'
plan = json.loads(plan_path.read_text(encoding='utf-8'))
asset = next(a for a in plan['assets'] if a['id'] == entry_id)
with Image.open(source) as image:
    image = image.convert('RGB')
    if image.width != image.height:
        raise ValueError('Expected a square illustration; review before installing.')
    for folder, size in [('img', 512), ('thumb', 256)]:
        target = root / 'public/atlas' / folder / f'{entry_id}.webp'
        if target.exists():
            raise FileExistsError(target)
        image.resize((size, size), Image.Resampling.LANCZOS).save(target, 'WEBP', quality=88)
asset['status'] = 'generated'
asset['source'] = Path(source).name
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
data_path = root / 'public/atlas/supplemental.json'
data = json.loads(data_path.read_text(encoding='utf-8'))
next(e for e in data['entries'] if e['id'] == entry_id)['m'] |= 1
data_path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'Installed {entry_id}: 512px full + 256px thumbnail')
