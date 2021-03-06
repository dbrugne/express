/**
 * Module dependencies.
 */

var express = require('../..');
var bodyParser = require('body-parser');
var multiparty = require('multiparty');
var format = require('util').format;
var fs = require('fs');

var app = module.exports = express();

app.use(bodyParser());
app.use(function (req, res, next) {
  if (req.method === 'POST'
      && req.headers['content-type'].indexOf("multipart/form-data") !== -1) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
      req.files = files;
      req.body = fields;
      next();
    });
  } else {
    next();
  }
});
// Auto-cleanup tmpFiles middleware, if not, all the uploaded files will remains
// in tmpDir after requests. As Node crash often you should also implement a
// cleaning FS logic with something like https://github.com/visionmedia/reap
app.use(function (req, res, next) {
  var unlinkTmpFiles = function () {
    if (!req.files) {
      return;
    }
    var i;
    Object.keys(req.files).forEach(function (file) {
      var path;
      for (i = 0; i < req.files[file].length; i++) {
        path = req.files[file][i].path;
        fs.unlink(path, function (e) {
          if (e) {
            console.log('error: ' + e);
          } else {
            console.log(path + ' removed');
          }
        });
      }
    });
  };

  res.on('finish', unlinkTmpFiles);
  res.on('close', unlinkTmpFiles);
  next();
});

app.get('/', function (req, res) {
  res.send('<form method="post" enctype="multipart/form-data">'
    + '<h1>Multipart form</h1>'
    + '<p>Title: <input type="text" name="title" /></p>'
    + '<p>Image: <input type="file" name="image" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>'
    + '<form method="post">'
    + '<h1>No multipart form</h1>'
    + '<p>Title: <input type="text" name="title" /></p>'
    + '<p><input type="submit" value="Post" /></p>'
    + '</form>');
});

app.post('/', function (req, res, next) {
  // the uploaded file can be found as `req.files.image` and the
  // title field as `req.body.title`
  if (req.files && req.files.image && req.files.image.length > 0) {
    res.send(format('\nuploaded file <strong>%s</strong> (%d Kb) from field <strong>%s</strong> to <strong>%s</strong> as <strong>%s</strong>'
      , req.files.image[0].originalFilename
      , req.files.image[0].size / 1024 | 0
      , req.files.image[0].fieldName
      , req.files.image[0].path
      , req.body.title));

    // Do anything you want with your file...

  } else {
    res.send(format('\nform posted with value <strong>%s</strong>'
      , req.body.title));
  }
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}