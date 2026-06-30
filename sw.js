const CACHE_NAME = 'valo-v1.0.9';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './dashboard.html',
  './manifest.json',
  './valo.png',
  './lat_valo.png',
  
  // Scripts principaux et configuration
  './js/dashboard.js',
  './js/config.js', // (Ajouté si présent dans ton dossier /js pour Firebase)

  // Dossier Profil
  './profil/register.html',
  './profil/register.js',

  // Dossier Modals (Structure éclatée)
  './modal/revenu.html',
  './modal/sortie.html',
  './modal/js/revenu.js',
  './modal/js/sortie.js'
];

// Événement d'installation : Mise en cache des ressources critiques
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Événement d'activation : Nettoyage des anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Stratégie de cache : Cache First, Network Fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
