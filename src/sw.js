'use strict';

importScripts('serviceworker-cache-polyfill.js');

var CACHE_NAME = 'offline-youtube-demo-01',
    urlsToCache = [
      '/',
      '/bundle.js',
      '/style.css',
      '/material-color.css'
    ];

self.addEventListener('install', function (event) {
  console.log('ServiceWorker.oninstall: ', event);
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(function (cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('ServiceWorker.onactive: ', event);
  event.waitUntil(
    caches.keys()
    .then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function (event) {
  var url = event.request.url,
      offset = url.indexOf(location.host) + location.host.length;

  caches.match(event.request)
  .then(function (response) {
    if (response) {
      console.log('ServiceWorker.onfetch: Loading static contents from cache.', url);
      return response;
    }

    console.log('ServiceWorker.onfetch: Loading static contents from network.', url);

    var fetchRequest = event.request.clone();

    return fetch(fetchRequest).then(function(res) {
      var responseToCache;

      if (offset === -1 || !res || res.status >= 300 || res.type !== 'basic') {
        console.log('do not cache: ', res);
        return res;
      }

      if (url.slice(offset).indexOf('/video/') === 0) {
        responseToCache = res.clone();

        console.log('\tOpen cache ...');
        caches.open(CACHE_NAME).then(function(cache) {
          console.log('\tAnd cache it!');
          cache.put(fetchRequest, responseToCache);
        });
      }

      return res;
    });
  });
});
