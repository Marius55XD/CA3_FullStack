
const CACHE_NAME = 'wc-pwa-v5';

//List of assets
const ASSETS = [
  './',                           
  './Index.html',                  
  './CSS/style.css',               
  './JS/script.js',                
  './JSON/places.json',            
  './JSON/manifest.json',          
  './Images/worldCupIcon.png',     
  './Images/stadiumIcon.png'     
];

//install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

//activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {

          //Delete caches that dont match current version 
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  // claim ensures service worker controls all pages immediately
  self.clients.claim();
});

// Fetch event offline first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {

      if (cached) return cached;
      
      //If not cached fetch from network
      return fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          //if it fails return to index.html for offline fallback
          return caches.match('./Index.html');
        });
    })
  );
});
