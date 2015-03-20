(function (global) {
  'use strict';

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
    container.innerHTML = 'Invalid URL.';
  }

  function displayLoading() {
    input.disabled = true;
    input.removeEventListener('blur', inputHandler, false);
    input.removeEventListener('keypress', inputHandler, false);
    container.innerHTML = 'Loading...';
  }

  var container = document.querySelector('.player'),
      input = document.querySelector('input'),
      inputHandler = function (ev) {
        if (ev.type === 'keypress' && ev.keyCode !== 13) {
          return;
        }

        if (input.value) {
          get(input.value)
          .then(
            function () {
              if (container.innerHTML === 'Loading...') {
                container.innerHTML = 'Loaded.';
                console.log('window.open :' + '/offline');
                //window.open('//' + location.host + '/offline');
                location.pathname = 'offline';
              }
            },
            function (e) {
              displayError();
            }
          );
          displayLoading();
        }
      };

  input.addEventListener('blur', inputHandler, false);
  input.addEventListener('keypress', inputHandler, false);

}(this));
