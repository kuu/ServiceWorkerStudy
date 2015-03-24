(function (global) {
  'use strict';

  function storeCache(videoList) {
    console.log(videoList);
    /*
    var urlList = Object.keys(videoList).map(function (key) {
      return videoList[key].path;
    });

    caches.open('offline-youtube-demo-01').then(function(cache) {
      cache.addAll(urlList);
    });

      fetch().then(function(response) {
        return response.json();
      }).then(function(urls) {
    });
    */
  }

  function get(url) {
    return new Promise(function (fulfill, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/offlinify/?url=' + encodeURIComponent(url));
      xhr.onload = function() {
        if (xhr.status === 200) {
          fulfill(xhr.response);
        } else {
          reject(xhr.status);
        }
      };
      xhr.onerror = function(e) {
        reject(e);
      };
      xhr.send();
    });
  }

  function displayError() {
    message.innerHTML = 'Invalid URL.';
  }

  function displayLoading() {
    input.disabled = true;
    input.removeEventListener('blur', inputHandler, false);
    input.removeEventListener('keypress', inputHandler, false);
    message.innerHTML = 'Loading...';
  }

  var message = document.querySelector('.message'),
      input = document.querySelector('input'),
      inputHandler = function (ev) {
        ev.preventDefault();
        if (ev.type === 'keypress' && ev.keyCode !== 13) {
          return;
        }

        if (input.value) {
          get(input.value)
          .then(
            function (res) {
              if (message.innerHTML === 'Loading...') {
                message.innerHTML = 'Loaded.';
                storeCache(res);
              }
            },
            function (e) {
              displayError();
            }
          );
          displayLoading();
        }
      };

  //input.addEventListener('blur', inputHandler, false);
  input.addEventListener('keypress', inputHandler, false);

}(this));
