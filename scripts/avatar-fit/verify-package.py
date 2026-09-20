import hashlib,json,subprocess
from pathlib import Path
root=Path.cwd();source=root/'docs/design/avatar-shop-sources';rev='24ce5a38b561c6012d7307603fc378ca339ab58c'
animals=['horse','unicorn-moon','pegasus-star','tiger','wolf-aurora','deer-mist','panther-shadow','dragon','dragon-crystal','griffin-storm','phoenix']
names=[x+'.png' for x in animals]+[f'{fig}-{part}-{i}.png' for fig in ['explorer-girl','explorer-boy'] for part,count in [('skin',4),('clothing',6)] for i in range(count)]
for name in names:
 old=subprocess.check_output(['git','show',rev+':docs/design/avatar-shop-sources/'+name])
 assert old==(source/name).read_bytes(),name
report=json.loads((root/'trainer/assets/avatar-shop/build-report.json').read_text())
assert report['coverage']['ready'],report['coverage']
outputs=set()
for key,asset in report['assets'].items():
 assert hashlib.sha256((source/asset['sourceName']).read_bytes()).hexdigest()==asset['sourceSha256'],key
 for variant in asset['variants']:
  path=root/'trainer/assets/avatar-shop'/Path(variant['url']).name
  assert path.exists(),path
  assert hashlib.sha256(path.read_bytes()).hexdigest()==variant['sha256'],path
  outputs.add(path.name)
actual={p.name for p in (root/'trainer/assets/avatar-shop').glob('*.webp')}
assert actual==outputs,{'obsolete':sorted(actual-outputs),'missing':sorted(outputs-actual)}
evidence={'unchangedBaseAndClothingSources':len(names),'assetLayers':len(report['assets']),'verifiedWebPs':len(outputs),'smallBytes':report['coverage']['smallBytes'],'sourceRevision':rev,'personalAcceptance':False}
(root/'docs/reports/avatar-fit-v3-package-check.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps(evidence))
