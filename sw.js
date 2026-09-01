const CACHE='massnearme-v2';
const ASSETS=['.','index.html','parish_data.js','manifest.webmanifest',
 'icon-192.png','icon-512.png',
 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});

// Network-first for the app shell and the parish data, so weekly refreshes reach
// installed phones; cache is only the offline fallback. Static assets stay cache-first.
function isFresh(req){
  if(req.mode==='navigate') return true;
  const p=new URL(req.url).pathname;
  return p.endsWith('/parish_data.js')||p.endsWith('/index.html')||p.endsWith('/')||p.endsWith('/manifest.webmanifest');
}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes('tile.openstreetmap.org')) return; // let tiles hit network
  if(isFresh(e.request)){
    e.respondWith(fetch(e.request).then(resp=>{
      const cp=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{}); return resp;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
  }else{
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      const cp=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{}); return resp;
    }).catch(()=>caches.match('index.html'))));
  }
});
