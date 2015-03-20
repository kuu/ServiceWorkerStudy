'use strict';

importScripts('serviceworker-cache-polyfill.js');

var CACHE_NAME = '{{cacheName}}',
    urlsToCache = [
      '/',
      '/bundle.js',
      '/style.css',
      '/material-color.css'
    ].concat({{{cacheURLs}}}),
    dynamicContents = [
      '/offline'
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

self.addEventListener('fetch', function (event) {
  var url = event.request.url,
      offset = url.indexOf(location.host) + location.host.length;
  if (dynamicContents.indexOf(url.slice(offset)) !== -1) {
    // Dynamic contents
    if (navigator.onLine) {
      // Online
      console.log('ServiceWorker.onfetch: Loading dynamic contents from network.', event);
      return fetch(event.request).then(function(response) {
        // レスポンスが正しいかをチェック
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 重要：レスポンスを clone する。レスポンスは Stream で
        // ブラウザ用とキャッシュ用の2回必要。なので clone して
        // 2つの Stream があるようにする
        var responseToCache = response.clone();

        console.log('\tOpen cache ...');
        caches.open(CACHE_NAME).then(function(cache) {
          console.log('\tAnd cache it!');
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    } else {
      // Offline
      caches.match(event.request)
      .then(function (response) {
        if (response) {
          console.log('ServiceWorker.onfetch: Loading dynamic contents from cache.', event, response);
          return response;
        }
        console.error('ServiceWorker.onfetch: Offline and no cache.', event);
        return null;
      });
    }
  } else {
    // Static contents
    caches.match(event.request)
    .then(function (response) {
      if (response) {
        console.log('ServiceWorker.onfetch: Loading static contents from cache.', event);
        return response;
      }

      console.log('ServiceWorker.onfetch: Loading static contents from network.', event);

      // 重要：リクエストを clone する。リクエストは Stream なので
      // 一度しか処理できない。ここではキャッシュ用、fetch 用と2回
      // 必要なので、リクエストは clone しないといけない
      var fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(function(response) {
        // レスポンスが正しいかをチェック
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 重要：レスポンスを clone する。レスポンスは Stream で
        // ブラウザ用とキャッシュ用の2回必要。なので clone して
        // 2つの Stream があるようにする
        var responseToCache = response.clone();

        console.log('\tOpen cache ...');
        caches.open(CACHE_NAME).then(function(cache) {
          console.log('\tAnd cache it!');
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    });
  }
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
