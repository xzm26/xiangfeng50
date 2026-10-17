/* Download ahead without retaining every decoded bitmap in memory. */
window.GameAssets=(()=>{
 const base=new URL('./',location.href),cacheName='xiangfeng50-'+GAME_ASSETS.revision;
 let preparedResolve;const prepared=new Promise(resolve=>preparedResolve=resolve);const tasks=new Map(),queue=[];let running=0,started=false,foregroundUntil=0,pumpTimer;
 const absolute=file=>new URL(file,base).href;
 async function download(file){
  const url=absolute(file),hash=GAME_ASSETS.hashes?.[file],key=hash?url+'?content='+hash:url;let cache;
  try{if('caches'in window){cache=await caches.open(hash?'xiangfeng50-media-v1':cacheName);const hit=await cache.match(key);if(hit)return true}}catch{}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{const response=await fetch(hash?key:url,{signal:controller.signal,priority:'low',headers:{'X-Game-Prefetch':'1'}});if(!response.ok)throw Error('HTTP '+response.status);if(cache)await cache.put(key,response);else await response.arrayBuffer();return true}finally{clearTimeout(timer)}
 }
 function pump(){clearTimeout(pumpTimer);if(!queue.length)return;if(document.hidden||Date.now()<foregroundUntil){pumpTimer=setTimeout(pump,500);return}while(running<(navigator.connection?.saveData?1:3)&&queue.length){const file=queue.shift(),task=tasks.get(file);running++;download(file).then(task.resolve,()=>{tasks.delete(file);task.resolve(false)}).finally(()=>{running--;pump()})}}
 function warm(file,urgent=false){if(!/^https?:$/.test(location.protocol))return Promise.resolve(false);if(!file)return Promise.resolve(false);if(tasks.has(file)){if(urgent){const i=queue.indexOf(file);if(i>0){queue.splice(i,1);queue.unshift(file)}}return tasks.get(file).promise}let resolve;const promise=new Promise(r=>resolve=r);tasks.set(file,{promise,resolve});urgent?queue.unshift(file):queue.push(file);pump();return promise}
 function foreground(file){foregroundUntil=Date.now()+250;return Promise.resolve(true)}
 function prepare(files){if(started)return;started=true;const begin=()=>{files.forEach(file=>warm(file));GAME_ASSETS.files.filter(f=>/\.(webp|woff2)$/.test(f)).forEach(file=>warm(file));Promise.all([...tasks.values()].map(task=>task.promise)).then(preparedResolve)};if(document.readyState==='complete')setTimeout(begin,0);else addEventListener('load',begin,{once:true})}
 if('serviceWorker'in navigator&&/^https?:$/.test(location.protocol))addEventListener('load',()=>navigator.serviceWorker.register('sw.js?rev='+GAME_ASSETS.revision,{scope:'./',updateViaCache:'none'}).catch(()=>{}),{once:true});
 addEventListener('visibilitychange',()=>{if(!document.hidden)pump()});
 return{warm,foreground,prepare,ready:()=>prepared,preview:file=>GAME_ASSETS.previews[file]||'',cacheName};
})();




