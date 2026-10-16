/* Versioned first-party game cache. Navigation still checks for updates. */
importScripts('asset-map.js');
const CACHE='xiangfeng50-'+GAME_ASSETS.revision,BASE=new URL('./',self.location.href);
const url=file=>new URL(file,BASE).href;
const allowed=new Set(GAME_ASSETS.files.map(url));
allowed.add(BASE.href);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const file of ['index.html','style.css','cover.css','data.js','audio.js','asset-map.js','asset-loader.js','app.js']){const response=await fetch(url(file),{cache:'reload'});if(!response.ok)throw Error('Incomplete game shell');await cache.put(url(file),response)}await self.skipWaiting()})());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('xiangfeng50-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const request=event.request,key=new URL(request.url);key.search='';key.hash='';if(request.method!=='GET'||!allowed.has(key.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(request.mode==='navigate'){
   const cached=await cache.match(url('index.html'));let timer;
   const network=fetch(request,{cache:'no-cache'}).then(async response=>{if(response.ok)await cache.put(url('index.html'),response.clone());return response});
   try{if(!cached)return await network;return await Promise.race([network,new Promise(resolve=>timer=setTimeout(()=>resolve(cached),2000))])}catch(error){if(cached)return cached;throw error}finally{clearTimeout(timer)}
  }
  const cached=await cache.match(key.href);if(cached)return cached;
  const response=await fetch(request);if(response.ok)await cache.put(key.href,response.clone());return response;
 })());
});
