const appName = "restaurant-reviews";
const staticCacheVersion = appName + "-v1.0";
const contentImgCache = appName + "-images";

let allCaches = [staticCacheVersion, contentImgCache];


// Cache static assets when sw installs
self.addEventListener('install', function(evt) {
  evt.waitUntil(
    caches.open(staticCacheVersion).then(function(cache) {
      return cache.addAll([
        '/', // caches index.html
        '/restaurant.html',
        '/css/styles.css',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        'js/register-sw.js',
        'data/restaurants.json'
      ]);
    })
  );
});

// When sw activates, delete previous caches if any
self.addEventListener('activate', function(evt) {
  evt.waitUntil(caches.keys().then(function(cacheNames) {
    return Promise.all(cacheNames.filter(function(cacheName) {
      return cacheName.startsWith(appName) && !allCaches.includes(cacheName);
    }).map(function(cacheName) {
      return caches.delete(cacheName);
    }));
  }));
});

// Hijack fetch requests and respond with cached assests or fall back to network
self.addEventListener('fetch', function(evt) {
  const reqUrl = new URL(evt.request.url);
  // hijack requests made to our app only (not mapbox maps for insatnce)
  if (reqUrl.origin === location.origin) {
    if (reqUrl.pathname.startsWith('/restaurant.html')) {
      evt.respondWith(caches.match('/restaurant.html'));
      return; // No more request handling is needed, so exit
    }

    // Handling images
    if (reqUrl.pathname.startsWith('./img')) {
      evt.respondWith(serveImage(evt.request));
      return;
    }

  }


  evt.respondWith(caches.match(evt.request).then(function(response) {
    return response || fetch(evt.request);
  }));
});


// to  handle caching of responsive images on network response
function serveImage(request) {
  let imgStorageUrl = request.url;

  // Make a new URL with a stripped suffix and extension from the request url
  imgStorageUrl = imgStorageUrl.replace(/-small\.\w{3}|-medium\.\w{3}|-large\.\w{3}/i, '');

  return caches.open(contentImgCache).then(function(cache) {
    return cache.match(imgStorageUrl).then(function(response) {
      // return image from cache or else fetch it from the network
      return response || fetch(request).then(function(networkResponse) {
        cache.put(imgStorageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
