"""Refresh the browser cache version whenever shipped game files change."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
manifest=root/'asset-map.js'
old=json.loads(manifest.read_text(encoding='utf-8-sig').split('=',1)[1].rstrip().removesuffix(';'))
files=sorted(p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and '.git' not in p.parts and '.github' not in p.parts and p.name!='asset-map.js' and (p.relative_to(root).parts[0]=='assets' or p.suffix in ['.html','.css','.js']))
digest=hashlib.sha256()
for file in files:digest.update(file.encode());digest.update((root/file).read_bytes())
old.update(revision=digest.hexdigest()[:16],files=files+['asset-map.js'])
manifest.write_text('globalThis.GAME_ASSETS='+json.dumps(old,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Game cache revision:',old['revision'])
