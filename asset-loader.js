/* Download ahead without retaining every decoded bitmap in memory. */
window.GameAssets=(()=>{
 const base=new URL('./',location.href),cacheName='xiangfeng50-'+GAME_ASSETS.revision;
 const tasks=new Map(),queue=[];let running=0,started=false,foregroundUntil=0,pumpTimer;
 const absolute=file=>new URL(file,base).href;
 async function download(file){
  const url=absolute(file);let cache;
  try{if('caches'in window){cache=await caches.open(cacheName);const hit=await cache.match(url);if(hit)return true}}catch{}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{const response=await fetch(url,{signal:controller.signal,priority:'low'});if(!response.ok)throw Error('HTTP '+response.status);if(cache)await cache.put(url,response);else await response.arrayBuffer();return true}finally{clearTimeout(timer)}
 }
 function pump(){clearTimeout(pumpTimer);if(!queue.length)return;if(document.hidden||Date.now()<foregroundUntil){pumpTimer=setTimeout(pump,500);return}while(running<1&&queue.length){const file=queue.shift(),task=tasks.get(file);running++;download(file).then(task.resolve,()=>{tasks.delete(file);task.resolve(false)}).finally(()=>{running--;pump()})}}
 function warm(file,urgent=false){if(!/^https?:$/.test(location.protocol))return Promise.resolve(false);if(!file)return Promise.resolve(false);if(tasks.has(file)){if(urgent){const i=queue.indexOf(file);if(i>0){queue.splice(i,1);queue.unshift(file)}}return tasks.get(file).promise}let resolve;const promise=new Promise(r=>resolve=r);tasks.set(file,{promise,resolve});urgent?queue.unshift(file):queue.push(file);pump();return promise}
 function foreground(file){foregroundUntil=Date.now()+1200;return warm(file,true)}
 function prepare(files){if(started)return;started=true;const begin=()=>{files.forEach(file=>warm(file));GAME_ASSETS.files.filter(f=>/\.(webp|woff2)$/.test(f)).forEach(file=>warm(file))};if(document.readyState==='complete')setTimeout(begin,0);else addEventListener('load',begin,{once:true})}
 if('serviceWorker'in navigator&&/^https?:$/.test(location.protocol))addEventListener('load',()=>navigator.serviceWorker.register('sw.js?rev='+GAME_ASSETS.revision,{scope:'./',updateViaCache:'none'}).catch(()=>{}),{once:true});
 addEventListener('visibilitychange',()=>{if(!document.hidden)pump()});
 return{warm,foreground,prepare,preview:file=>GAME_ASSETS.previews[file]||'',cacheName};
})();



