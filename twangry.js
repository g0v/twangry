var http = require('http');
var nconf = require('nconf');
var fs = require('fs');
var async = require('async');

// set gloabl configuration
nconf.argv();
nconf.env();
nconf.file({ file: 'conf/'+nconf.get('NODE_ENV')+'.json' });

var Route = require(nconf.get('base')+'/lib/route');

var server = http.createServer(function(req, res){
  var route = new Route(req, res);
  route.run();
  route = null; // release memory?
  req.on('error', function (err) {
    console.log(err);
  });
}).listen(nconf.get('port'));

console.log('server is working on port ' + nconf.get('port'));
