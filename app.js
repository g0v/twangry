var http = require('http');
var config = require('config');
var route = require('./lib/route');

var server = http.createServer(function(req, res){
  route.watch(req);
  route.run(req, res);
  req.on('error', function (err) {
    console.log(err);
  });
}).listen(config.port);

console.log('server is working on port ' + config.port);
