const CACHE='puls-shell-harpex-simulator-v4';
const BASE=self.registration.scope;
const ASSETS=['','app.html','app.html?v=simulator-3','simulator.js?v=3','simulator.css?v=3','app.js','experience.js?v=simulator-3','theme.css?v=simulator-3','manifest.webmanifest','harpex-icon.svg','harpex-icon-192.png','harpex-icon-512.png','foedevarer-skabelon.csv'].map(path=>BASE+path);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('puls-shell-')&&key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin||!url.href.startsWith(BASE)||e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(response=>{
    if(response.ok){const copy=response.clone();e.waitUntil(caches.open(CACHE).then(cache=>cache.put(e.request,copy)))}
    return response;
  }).catch(()=>caches.match(e.request).then(response=>response||(e.request.mode==='navigate'?caches.match(BASE):Response.error()))));
});
