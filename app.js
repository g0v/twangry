var http = require('http');
var route = require('./lib/route');
var port = 8080;

var server = http.createServer(function(req, res){
  route.watch(req);
  route.run(req, res, port);
  req.on('error', function (err) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('404 Not Found\n');
    res.end();
  });
});

server.listen(port);
