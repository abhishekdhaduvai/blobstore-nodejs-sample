var http = require('http'); // needed to integrate with ws package for mock web socket server.
var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');
var app = express();
var httpServer = http.createServer(app);
var axios = require('axios');
var formidable = require('formidable');
var util = require('util');
var fs = require('fs');
var AWS = require('aws-sdk');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, process.env['base-dir'] ? process.env['base-dir'] : '../')));

// if running locally, we need to set up the proxy from local config file:
var node_env = process.env.node_env || 'development';
console.log('************ Environment: '+node_env+'******************');

var bucket;

if (node_env === 'development') {

  var devConfig = require('./localConfig.json')[node_env];
  AWS.config.update({
    accessKeyId: devConfig.accessKeyId,
    secretAccessKey: devConfig.secretAccessKey,
    region:'us-west-2'
  });
  bucket = devConfig.bucketName;
    
} else {
  var vcapsServices = JSON.parse(process.env.VCAP_SERVICES);
  var blobstore = vcapsServices['predix-blobstore'][0];
  AWS.config.update({
    accessKeyId: blobstore.credentials.access_key_id,
    secretAccessKey: blobstore.credentials.secret_access_key,
    region:'us-west-2'
  });
  bucket = blobstore.credentials.bucket_name
}

s3 = new AWS.S3({apiVersion: '2006-03-01'});

app.get('/blob', (req, res) => {
  s3.listObjects({
    Bucket: bucket
  }, (err, data) => {
    if(err) {
      res.status(400).send('Error getting files in the bucket')
    }
    else {
      res.send(data)
    }
  })
});

app.get('/blob/:filename', (req, res) => {
  console.log('Downloading', req.params.filename);
  const filename = req.params.filename;
  res.attachment(filename);
  s3.getObject({
    Bucket: bucket,
    Key: filename
  }, (err, data) => {
    if(err) {
      console.log('error ',err)
      res.status(400).send('There was a problem getting the file')
    }
    else {
      console.log(data)
    }
  }).createReadStream().pipe(res);
});

app.delete('/blob/:filename', (req, res) => {
  console.log('Deleting ', req.params.filename)
  const filename = req.params.filename;
  s3.deleteObject({
    Bucket: bucket,
    Key: filename
  }, (err, data) => {
    if(err){
      console.log('There was an error while deleting the file '+filename);
      res.status(400).send('There was an error while deleting the file '+filename)
    }
    else {
      res.status(200).send('Deleted '+filename);
    }
  })
});

app.post('/blob', (req, res) => {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    if(err){
      res.status(400).send('Error uploading the file')
    }
    else{
      util.inspect({fields: fields, files: files});
    }
  });

  form.on('end', function(fields, files) {
    fs.readFile(this.openedFiles[0].path, (err, data) => {
      if(err){
        res.status(400).send('Error uploading the file')
      }
      else {
        console.log('path ', this.openedFiles[0].path)
        s3.upload({
          Bucket: bucket,
          Key: this.openedFiles[0].name,
          Body: data
        }, (err, data) => {
          if(err) {
            res.status(400).send('Error uploading the file')
          }
          else {
            res.send('Uploaded the file!')
          }
        })
      }
    })
  });
})

////// error handlers //////
// catch 404 and forward to error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// development error handler - prints stacktrace
if (node_env === 'development') {
	app.use(function(err, req, res, next) {
		if (!res.headersSent) {
			res.status(err.status || 500);
			res.send({
				message: err.message,
				error: err
			});
		}
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	if (!res.headersSent) {
		res.status(err.status || 500);
		res.send({
			message: err.message,
			error: {}
		});
	}
});

httpServer.listen(process.env.VCAP_APP_PORT || 5000, function () {
	console.log ('Server started on port: ' + httpServer.address().port);
});

module.exports = app;