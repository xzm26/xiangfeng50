/* Stream images immediately; cache original media by content across releases. */
importScripts('asset-map.js?v='+encodeURIComponent(new URL(self.location.href).searchParams.get('rev')||''));
const CACHE='xiangfeng50-'+GAME_ASSETS.revision,MEDIA='xiangfeng50-media-v1',BASE=new URL('./',self.location.href);
const url=file=>new URL(file,BASE).href;
const allowed=new Set(GAME_ASSETS.files.map(url));allowed.add(BASE.href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await Promise.all(['index.html','style.css','cover.css','data.js','audio.js','asset-map.js','asset-loader.js','app.js'].map(async file=>{
  const response=await fetch(url(file)+'?v='+GAME_ASSETS.revision);if(!response.ok)throw Error('Incomplete game shell');await cache.put(url(file),response);
 }));await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Migrate verified, unchanged images from the previous release, including the old cache format.
 const media=await caches.open(MEDIA);
 for(const name of await caches.keys())if(name.startsWith('xiangfeng50-')&&name!==CACHE&&name!==MEDIA){
  const old=await caches.open(name);
  for(const [file,hash] of Object.entries(GAME_ASSETS.hashes||{})){
   const key=url(file)+'?content='+hash;if(await media.match(key))continue;
   const response=await old.match(url(file));if(!response)continue;
   const bytes=await response.clone().arrayBuffer();
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
   if(digest===hash)await media.put(key,response);
  }await caches.delete(name);
 }await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,key=new URL(request.url);
 if(key.searchParams.has('v')&&key.searchParams.get('v')!==GAME_ASSETS.revision)return;
 key.search='';key.hash='';if(request.method!=='GET'||!allowed.has(key.href))return;
 let finish;const saved=new Promise(resolve=>finish=resolve);event.waitUntil(saved);
 event.respondWith((async()=>{
  const file=key.href.slice(BASE.href.length),hash=GAME_ASSETS.hashes?.[file];
  const cache=await caches.open(hash?MEDIA:CACHE),cacheKey=hash?key.href+'?content='+hash:key.href;
  if(request.mode==='navigate'){
   const cached=await cache.match(url('index.html'));let timer;
   const network=fetch(request,{cache:'no-cache'}).then(response=>{if(response.ok)cache.put(url('index.html'),response.clone()).then(finish,finish);else finish();return response},error=>{finish();throw error});
   try{if(!cached)return await network;return await Promise.race([network,new Promise(resolve=>timer=setTimeout(()=>resolve(cached),2000))])}catch(error){if(cached)return cached;throw error}finally{clearTimeout(timer)}
  }
  const cached=await cache.match(cacheKey);if(cached){finish();return cached}
  const response=await fetch(hash?new Request(cacheKey,request):request);
  if(response.ok&&!request.headers.has('X-Game-Prefetch'))cache.put(cacheKey,response.clone()).then(finish,finish);else finish();
  return response;
 })().catch(error=>{finish();throw error}));
});
