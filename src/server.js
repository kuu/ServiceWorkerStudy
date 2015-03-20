'use strict';

var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    crypto = require('crypto'),
    express = require('express'),
    bodyParser = require('body-parser'),
    config = require('config'),
    ytdl = require('ytdl-core'),
    Handlebars = require('handlebars'),
    JsonDB = require('node-json-db');

var app = express(),
    port = process.env.PORT || 3030,
    BASE_DIR = path.join(__dirname, '../'),
    DOCS_DIR = path.join(BASE_DIR, 'dist/'),
    VIDEO_DIR = 'video/', filePath,
    getHTMLText = Handlebars.compile(
      fs.readFileSync(BASE_DIR + 'offline.html', {encoding: 'utf8'})
    ),
    getJSText = Handlebars.compile(
      fs.readFileSync(BASE_DIR + 'sw.js', {encoding: 'utf8'})
    ),
    db = new JsonDB("offline", true, false);

app.use(express.static(BASE_DIR + 'dist'));

app.get('/api/offlinify', function (req, res) {
  var videoURL = decodeURIComponent(req.query.url),
      hostname = url.parse(videoURL, true).hostname,
      fileName;

  if(hostname !== 'www.youtube.com' && hostname !== 'youtu.be') {
    res.sendStatus(404);
  }

  filePath = VIDEO_DIR + crypto.randomBytes(20).toString('hex') + '.mp4';

  // Get the info associated with the video URL
  ytdl.getInfo(videoURL, { downloadURL: true }, function (err, info) {

    if (err) {
      res.sendStatus(404);
      return;
    }

    // Download and save the actual video data.
    ytdl(videoURL, { filter: function(format) { return format.quality === 'medium' && format.container === 'mp4'; } })
    .pipe(fs.createWriteStream(DOCS_DIR + filePath))
    .on('finish', function() {
      var version;
      try {
        version = parseInt(db.getData("/version"));
      } catch (e) {
        // DB is empty. (first access)
        version = 0;
      }

      // Write DB.
      db.push('/' + filePath, {
        title: info.title,
        path: filePath
      });
      db.push('/version', ++version);

      // Send response.
      res.status(200).send(filePath);
    });
  });
});

app.get('/offline', function (req, res) {
  // Read DB
  var videoList = db.getData("/video"),
      version = parseInt(db.getData("/version")),
      urlList, elementList;

  if (!videoList) {
    res.sendStatus(404);
    return;
  }

  // Update Service Worker.
  urlList = Object.keys(videoList).map(function (key) {
    return videoList[key].path;
  });

  fs.writeFileSync(DOCS_DIR + 'sw.js', getJSText({
    cacheName: 'offline-youtube-demo-' + (version),
    cacheURLs: JSON.stringify(urlList)
  }));

  console.log('Generated SW: version=' + version);

  // Send response
  elementList = Object.keys(videoList).map(function (key) {
    var item = videoList[key];
    return '<div><h2>' + item.title + '</h2><video src="' + item.path + '" controls muted></video></div>';
  });

  res.status(200).send(getHTMLText({videoList: elementList}));
});

// Start server
if (require.main === module) {
  console.log('Server listening on port %s', port);
  app.listen(port);
}

module.exports = app;
