const CACHE='puls-shell-harpex-libraries-v1';
const BASE=self.registration.scope;
const ASSETS=['','app.html','app.html?v=libraries-1','simulator.js?v=4','simulator.css?v=3','app.js?v=libraries-1','experience.js?v=libraries-1','locale.js?v=1','library-core.js?v=1','library-ui.js?v=1','library.css?v=1','season.js?v=1','workout-drafts.js?v=2','history.js?v=libraries-1','history.css?v=2','organization.js?v=2','organization.css?v=2','theme.css?v=simulator-3','identity.js?v=1','identity.css?v=2','manifest.webmanifest','harpex-icon.svg','harpex-icon-192.png','harpex-icon-512.png','foedevarer-skabelon.csv'].map(path=>BASE+path);
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
