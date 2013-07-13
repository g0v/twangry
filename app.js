var http = require('http');
var url = require('url');
var json = require('request-json').JsonClient;
var timeline = require('./lib/twtimeline');
var wiki = require('./lib/wiki');

var server = http.createServer(function(req, res){
  // block error request first
  var path = url.parse(decodeURIComponent(req.url));
  var serverError = function(code, content) {
    res.writeHead(code, {'Content-Type': 'text/plain'});
    res.end(content);
  }
  var html = timeline.content(path.pathname);

  // request handling
  if(req.method === 'POST'){
    serverError(404, '404 Bad Request');
  }
  if(path.pathname.match(/^\/wiki\/.+\.json$/g)){
    var page = path.pathname.replace('/wiki/', '').replace('.json','');
    var zhwiki = new json(wiki.option.domain);

    if(page.match(/^[0-9]+年[0-9]月$/)){
      zhwiki.get(wiki.option.api+page, function onGet(err, response, body) {
        var content = wiki.getPage(body);
        res.write(wiki.parseDatePage(content));
        res.end();
      });
    }
    else{
      console.log(page);
      zhwiki.get(wiki.option.api+page, function onGet(err, response, body) {
        var content = wiki.getPage(body);
        res.write(wiki.parseSpecialPage(content, page));
        res.end();
      });
    }
    // should be end inside
  }
  else{
    if(html === false){
      serverError(404, 'Could not found keyword on wikipedia');
    }
    else{
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(html);
    }
  }
});

server.listen(6666);
