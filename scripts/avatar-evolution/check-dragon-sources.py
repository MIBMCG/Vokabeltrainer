from PIL import Image, ImageDraw
from pathlib import Path
import hashlib, json

root = Path.cwd()
source_dir = root / 'docs/design/avatar-evolution-sources'
names = ['dragon-stage-1-v3.png', 'dragon-stage-2-v3.png',
         'dragon-stage-3-v1.png', 'dragon-stage-4-v2.png']
report_dir = root / 'docs/reports/assets/avatar-evolution'
report_dir.mkdir(parents=True, exist_ok=True)
board = Image.new('RGB', (1024, 728), '#ffffff')
draw = ImageDraw.Draw(board)
facts = []
for index, name in enumerate(names):
    path = source_dir / name
    im = Image.open(path)
    assert im.mode == 'RGBA', (name, im.mode)
    alpha = im.getchannel('A')
    assert alpha.getextrema() == (0, 255), (name, alpha.getextrema())
    hist = alpha.histogram()
    solid = alpha.point(lambda value: 255 if value > 200 else 0).getbbox()
    assert solid and min(im.size) >= 768
    facts.append({'source': name, 'size': list(im.size), 'mode': im.mode,
                  'alphaRange': list(alpha.getextrema()), 'alphaBounds': list(alpha.getbbox()),
                  'solidBounds': list(solid), 'fullyTransparentPixels': hist[0],
                  'fullyOpaquePixels': hist[255],
                  'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    sprite = im.copy()
    sprite.thumbnail((236, 316), Image.Resampling.LANCZOS)
    for row, color in enumerate(['#fff7e4', '#142c40']):
        card = Image.new('RGBA', (256, 344), color)
        card.alpha_composite(sprite, ((256-sprite.width)//2, 334-sprite.height))
        board.paste(card.convert('RGB'), (index*256, row*364+20))
        draw.text((index*256+12, row*364+4), f'Stufe {index+1} / 256px', fill='#123b45')
board.save(report_dir / 'dragon-light-dark-256.png')
result = {'scope': 'four production source candidates; no product integration', 'sources': facts}
(report_dir / 'source-check.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
print(json.dumps(result, ensure_ascii=False))
