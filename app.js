var http = require('http');
var route = require('./lib/route');

var server = http.createServer(function(req, res){
  route.run(req,res);
});

server.listen(6666);