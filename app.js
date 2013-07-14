// third party
var http = require('http');
var url = require('url');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

// local
var wiki = require('./lib/wiki');

var server = http.createServer(function(req, res){
  var serverError = function(code, content) {
    res.writeHead(code, {'Content-Type': 'text/plain'});
    res.end(content);
  }

  // block error request first
  var path = url.parse(decodeURIComponent(req.url));

  // request handling
  if(req.method === 'POST'){
    serverError(404, '404 Bad Request');
  }
  if(path.pathname.match(/^\/wiki\/.+\.json$/g)){
    var page = path.pathname.replace('/wiki/', '').replace('.json','');
    var uri = 'http://'+wiki.option.domain+'/'+wiki.option.render+page;

    request(uri, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var dom =  cheerio.load(body);
        res.write(wiki.parse(dom, body, page), 'utf8');
        res.end();
      }
    })
    // should be end inside
  }
  else
  if(path.pathname.match(/^\/wiki\/[^.]+$/g)){
    var page = path.pathname.replace('/', '');
    var source = fs.readFileSync('./page.tpl', 'utf-8').replace();
    var html = source.replace('example_json.json', '/'+page+'.json');
    if(html === false){
      http.serverError(404, 'Could not found keyword on wikipedia');
    }
    else{
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(html);
    }
  }
  else{
    serverError(404, '404 Bad Request');
  }
});

server.listen(6666);
