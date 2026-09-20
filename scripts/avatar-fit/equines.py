"""Reproduce the approved classical equine equipment repairs from original Git bytes.

Development-only tool; requires Pillow and NumPy, never runs inside the app.
Run from any directory. The original commit is deliberately pinned.
"""
from pathlib import Path
import hashlib, io, json, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/design/avatar-shop-sources'
OUT = ROOT / '.superpowers/sdd/2026-09-20-avatar-fit-v3/equines'
REV = '24ce5a38b561c6012d7307603fc378ca339ab58c'
FIGURES = ['horse', 'unicorn-moon', 'pegasus-star']
ITEMS = ['moon-head', 'moon-body', 'moon-adornment', 'stars-head', 'stars-body', 'stars-adornment']

def original_bytes(name):
    return subprocess.check_output(['git', 'show', f'{REV}:docs/design/avatar-shop-sources/{name}'], cwd=ROOT, stderr=subprocess.PIPE)

def original(name):
    return Image.open(io.BytesIO(original_bytes(name))).convert('RGBA')

def meta(name):
    return json.loads(original_bytes(name.replace('.png', '.json')))

def registered(name):
    im = original(name); reg = meta(name).get('registration', {'scale':1,'x':0,'y':0})
    canvas = Image.new('RGBA', (1024,1536))
    im = im.resize((round(im.width*reg['scale']), round(im.height*reg['scale'])), Image.Resampling.LANCZOS)
    canvas.alpha_composite(im, (round(reg['x']), round(reg['y'])))
    return canvas

def polygon(points, size=(1024,1536), feather=1):
    im = Image.new('L', size); ImageDraw.Draw(im).polygon(points, fill=255)
    return im.filter(ImageFilter.GaussianBlur(feather)) if feather else im

def masked(im, mask):
    result = im.copy()
    result.putalpha(Image.fromarray((np.array(im.getchannel('A'), dtype=np.float32)*np.array(mask)/255).astype('uint8')))
    return result

def save_layer(fig, item, plane, image, description, recipe):
    name = f'{fig}-{item}-{plane}.png'; path = SOURCE/name
    image.save(path)
    metadata = {
      'sourceFile':name, 'figure':fig, 'layer':plane,
      'generator':'Classical raster editing (Pillow/NumPy), explicitly authorized 2026-09-20',
      'provenance':description, 'originalCommit':REV,
      'originalSources':recipe.pop('originalSources', []),
      'repairScript':'../../../scripts/avatar-fit/equines.py',
      'recipe':recipe, 'canvas':{'width':1024,'height':1536},
      'registration':{'scale':1,'x':0,'y':0},
      'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
      'qa':{'status':'internal-fit-review-pending','personalAcceptance':False}
    }
    path.with_suffix('.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')

def provenance(name):
    return {'path':name,'sha256':hashlib.sha256(original_bytes(name)).hexdigest()}

def cuffs(fig):
    # Original pieces share one source. Each is now independently fitted and
    # only the front-facing band remains visible, not the opaque hollow cup.
    name = 'horse-moon-adornment-front.png'; im=original(name)
    boxes=[(184,1270,322,1375),(426,1266,566,1363),(553,1355,734,1475),(781,1332,936,1438)]
    ellipses=[(252,1305,55,14),(493,1294,55,14),(643,1386,70,18),(855,1361,61,17)]
    poses={
      'horse':[(251,1331,84,1),(490,1325,84,10),(634,1390,103,-2),(841,1370,96,14)],
      'unicorn-moon':[(256,1318,76,0),(488,1320,79,11),(635,1389,98,-3),(842,1368,87,16)],
      'pegasus-star':[(283,1374,81,0),(503,1363,92,16),(653,1420,100,-1),(846,1400,107,18)]
    }
    output=Image.new('RGBA',im.size)
    records=[]
    for box, ellipse, target in zip(boxes,ellipses,poses[fig]):
        part=im.crop(box); cx,cy,rx,ry=ellipse
        yy,xx=np.mgrid[box[1]:box[3],box[0]:box[2]]
        arc=cy+ry*np.sqrt(np.maximum(0,1-((xx-cx)/rx)**2))
        alpha=np.array(part.getchannel('A'),dtype=float)
        alpha*=np.clip((yy-arc+1)/2,0,1)
        # Soft aura above the rim is removed together with the hidden rim.
        part.putalpha(Image.fromarray(alpha.astype('uint8')))
        bbox=part.getbbox();part=part.crop(bbox)
        tx,ty,width,angle=target
        part=part.resize((width,round(part.height*width/part.width)),Image.Resampling.LANCZOS)
        part=part.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
        output.alpha_composite(part,(round(tx-part.width/2),round(ty-part.height/2)))
        records.append({'crop':box,'frontRimEllipse':ellipse,'centerWidthAngle':target})
    save_layer(fig,'moon-adornment','front',output,'Original silver ornamentation retained; opaque ring opening and rear arch removed, four independent limb anchors, widths and angles.',{'originalSources':[provenance(name)],'parts':records})

def cape(fig):
    name=f'{fig}-moon-body-front.png'; front=original(name)
    gem={'horse':(871,739,43,53),'unicorn-moon':(901,630,31,38),'pegasus-star':(830,910,43,58)}[fig]
    # The disconnected rising lappet is the far side of the collar. The body
    # hides it in this camera view; preserve the gem, erase the entire far tip.
    gx,gy,grx,gry=gem;yy,xx=np.mgrid[:1536,:1024]
    keep=(xx<gx-grx*0.55)|(((xx-gx)/grx)**2+((yy-gy)/gry)**2<=1)
    front=masked(front,Image.fromarray((keep*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8)))
    # Piecewise inverse warp: drape stays below withers, free crescent is folded
    # inward at the right chest; rear trailing panel is no longer duplicated.
    # Control coordinates are on each figure's fixed full source canvas.
    configs={
      'horse':{'sx':[0,180,500,760,890,1024], 'dx':[205,285,480,685,808,930], 'sy':[0,490,740,990,1270,1536], 'dy':[150,510,735,900,970,1200]},
      'unicorn-moon':{'sx':[0,180,500,760,900,1024], 'dx':[203,280,462,675,800,910], 'sy':[0,410,620,940,1230,1536], 'dy':[150,500,710,900,970,1200]},
      'pegasus-star':{'sx':[0,180,500,760,890,1024], 'dx':[245,313,496,698,805,925], 'sy':[0,650,820,1080,1350,1536], 'dy':[200,650,730,940,1020,1250]}
    }
    cfg=configs[fig]
    # Bilinear mesh cells preserve every painted fold and edge, rather than
    # clipping the hem with a straight silhouette mask.
    mesh=[]
    for yi in range(len(cfg['sy'])-1):
      for xi in range(len(cfg['sx'])-1):
        x0,x1=cfg['sx'][xi:xi+2];y0,y1=cfg['sy'][yi:yi+2]
        dx0,dx1=cfg['dx'][xi:xi+2];dy0,dy1=cfg['dy'][yi:yi+2]
        mesh.append(((dx0,dy0,dx1,dy1),(x0,y0,x0,y1,x1,y1,x1,y0)))
    fitted=front.transform((1024,1536),Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
    # A local mane occluder exposes the existing original hair, not copied skin.
    hair={
      'horse':[(479,500),(561,489),(533,611),(492,675),(454,709),(424,688),(442,618)],
      'unicorn-moon':[(470,490),(568,471),(544,587),(520,620),(486,659),(505,652),(488,681),(465,694),(479,673),(450,702),(423,704),(438,691),(417,686),(440,668),(454,624),(449,599),(470,564)],
      'pegasus-star':[(453,670),(572,623),(583,744),(545,819),(479,854),(407,830),(427,777)]
    }
    occluder=polygon(hair[fig],feather=1)
    pixels=np.array(original(fig+'.png'))
    if fig=='horse':
      hair_only=((pixels[:,:,0]<165)&(pixels[:,:,1]<130)).astype('uint8')*255
      occluder=Image.fromarray((np.array(occluder,dtype=float)*hair_only/255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
    elif fig=='pegasus-star':
      hair_only=(pixels[:,:,0]>105).astype('uint8')*255
      occluder=Image.fromarray((np.array(occluder,dtype=float)*hair_only/255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
    fitted=masked(fitted,Image.fromarray(255-np.array(occluder)))
    save_layer(fig,'moon-body','front',fitted,'Body-specific piecewise drape adjustment: folded chest edge, shorter hem, connected clasp and exposed foreground mane. Far collar tip and old detached rear curtain removed. No base pixels changed.',{'originalSources':[provenance(name),provenance(f'{fig}-moon-body-rear.png')],'mesh':cfg,'maneOcclusionPolygon':hair[fig],'farSideGemBoundary':gem})
    # This replacement includes the connected visible drape. Retire the old
    # duplicate rear curtain rather than shipping an invisible/dangling layer.
    for suffix in ['.png','.json']:
      path=SOURCE/f'{fig}-moon-body-rear{suffix}'
      if path.exists():path.unlink()

def composite(fig,item,originals=False):
    base=original(fig+'.png');out=Image.new('RGBA',base.size,'#f4eee2')
    for plane in ['rear','base','front']:
      if plane=='base':out.alpha_composite(base);continue
      name=f'{fig}-{item}-{plane}.png'
      if originals:
        try:layer=registered(name)
        except subprocess.CalledProcessError:continue
      else:
        if not (SOURCE/name).exists():continue
        src=Image.open(SOURCE/name).convert('RGBA');reg=json.loads((SOURCE/name).with_suffix('.json').read_text()).get('registration',{'scale':1,'x':0,'y':0})
        layer=Image.new('RGBA',base.size);src=src.resize((round(src.width*reg['scale']),round(src.height*reg['scale'])),Image.Resampling.LANCZOS);layer.alpha_composite(src,(round(reg['x']),round(reg['y'])))
      out.alpha_composite(layer)
    return out

def saddle(fig):
    name=f'{fig}-stars-body-front.png'
    layer=registered(name)
    # The source incorrectly showed both stirrups on the visible side. Hide the
    # distant stirrup behind the torso, without cutting the painted saddle flap.
    reg=meta(name)['registration']
    far_stirrup=[(296,684),(337,686),(326,778),(348,849),(344,914),(242,914),(252,831),(280,786)]
    raw=[((x-170)/.42,(y-400)/.42) for x,y in far_stirrup]
    cut=[(x*reg['scale']+reg['x'], y*reg['scale']+reg['y']) for x,y in raw]
    layer=masked(layer,Image.fromarray(255-np.array(polygon(cut,feather=.8))))
    shift=(0,-63) if fig=='pegasus-star' else (0,0)
    if shift!=(0,0):
      moved=Image.new('RGBA',layer.size);moved.alpha_composite(layer,shift);layer=moved
    # Locally restore the foreground mane through the saddle's shoulder edge.
    hair={
      'horse':[(479,500),(561,489),(533,611),(492,675),(454,709),(424,688),(442,618)],
      'unicorn-moon':[(470,490),(568,471),(544,587),(520,620),(486,659),(505,652),(488,681),(465,694),(479,673),(450,702),(423,704),(438,691),(417,686),(440,668),(454,624),(449,599),(470,564)],
      'pegasus-star':[(453,670),(572,623),(583,744),(545,819),(479,854),(407,830),(427,777)]
    }
    occ=polygon(hair[fig],feather=1);pixels=np.array(original(fig+'.png'))
    if fig=='horse': select=(pixels[:,:,0]<165)&(pixels[:,:,1]<130)
    elif fig=='pegasus-star':select=pixels[:,:,0]>105
    else:select=np.ones(pixels.shape[:2],dtype=bool)
    occ=Image.fromarray((np.array(occ)*select).astype('uint8')).filter(ImageFilter.GaussianBlur(.8))
    layer=masked(layer,Image.fromarray(255-np.array(occ)))
    save_layer(fig,'stars-body','front',layer,'Distant stirrup hidden behind torso; original near stirrup and painted saddle contours retained. Pegasus saddle raised onto back; local foreground mane exposed.',{'originalSources':[provenance(name)],'originalRegistration':reg,'hiddenStirrupPolygon':cut,'shift':shift,'maneOcclusionPolygon':hair[fig]})

def horse_star_head():
    name='horse-stars-head-front.png';out=Image.new('RGBA',(1024,1536))
    out.alpha_composite(registered(name),(60,-55))
    save_layer('horse','stars-head','front',out,'Forehead ornament raised and moved toward the forehead center to leave the visible eye clear of the dangling star.',{'originalSources':[provenance(name)],'originalRegistration':meta(name)['registration'],'shift':[60,-55]})

def previews():
    OUT.mkdir(parents=True,exist_ok=True)
    public=ROOT/'docs/design/avatar-fit-v3/equines';public.mkdir(parents=True,exist_ok=True)
    for fig in FIGURES:
      sheet=Image.new('RGB',(960,1020),'#f4eee2');draw=ImageDraw.Draw(sheet)
      comparison=Image.new('RGB',(1536,824),'#f4eee2');labels=ImageDraw.Draw(comparison)
      for i,item in enumerate(ITEMS):
        im=composite(fig,item);im.save(OUT/f'{fig}-{item}-after.png')
        im.thumbnail((320,480));x=i%3*320;y=i//3*510;sheet.paste(im,(x,y+24));draw.text((x+8,y+4),item,fill='#172732')
        for k,old in enumerate([True,False]):
          cell=composite(fig,item,originals=old);cell.thumbnail((256,384))
          x=i%3*512+k*256;y=i//3*412
          comparison.paste(cell,(x,y+28));labels.text((x+8,y+6),item+(' | VORHER' if old else ' | NACHHER'),fill='#172732')
      sheet.save(OUT/f'{fig}-all-after.jpg')
      comparison.save(public/f'{fig}-comparison.jpg',quality=93)

if __name__=='__main__':
    for fig in FIGURES:cuffs(fig);cape(fig);saddle(fig)
    horse_star_head()
    previews()
