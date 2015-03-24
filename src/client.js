(function (global) {
  'use strict';

  function get(url) {
    return new Promise(function (fulfill, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
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
    input.disabled = false;
    input.addEventListener('blur', inputHandler, false);
    input.addEventListener('keypress', inputHandler, false);
    message.innerHTML = 'Invalid URL.';
  }

  function displayLoading() {
    input.disabled = true;
    input.removeEventListener('blur', inputHandler, false);
    input.removeEventListener('keypress', inputHandler, false);
    message.innerHTML = 'Loading...';
  }

  function displayLoaded() {
    input.disabled = false;
    input.addEventListener('blur', inputHandler, false);
    input.addEventListener('keypress', inputHandler, false);
    message.innerHTML = 'Loaded.';
  }

  function displayList(response) {
    var container = document.querySelector('.video-list'),
        elementList, videoList;

    try {
      videoList = JSON.parse(response);
    } catch (e) {
      videoList = {};
    }
    elementList = Object.keys(videoList).map(function (key) {
      var item = videoList[key];
      return '<div><h2>' + item.title + '</h2><video src="' + item.path + '" controls muted></video></div>';
    });
    container.innerHTML = elementList.join('');

    displayLoaded();
  }

  function request(url) {
    displayLoading();
    return get(url)
    .then(
      function (res) {
        displayList(res);
      },
      function (e) {
        displayError();
      }
    );
  }

  var message = document.querySelector('.message'),
      input = document.querySelector('input'),
      inputHandler = function (ev) {
        ev.preventDefault();
        if (ev.type === 'keypress' && ev.keyCode !== 13) {
          return;
        }

        if (input.value) {
          request('/api/offlinify/?url=' + encodeURIComponent(input.value))
          .then(
            function () {
              input.value = '';
            }
          );
        }
      };

  //input.addEventListener('blur', inputHandler, false);
  input.addEventListener('keypress', inputHandler, false);

  request('/api/videolist');

}(this));
